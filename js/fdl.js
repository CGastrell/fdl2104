(function ( $ ) {

	$.fn.centrar = function( options ) {

		// This is the easiest way to have default options.
		var settings = $.extend({
			// These are the defaults.
			vertical: true,
			horizontal: true
		}, options );

		var container = this.parent();
		var n = {
			top: settings.vertical ? (container.innerHeight() - this.outerHeight()) / 2 : this.offset().top,
			left: settings.horizontal ? (container.innerWidth() - this.outerWidth()) /2 : this.offset().left
		}
		return this.offset(n);
	};

}( jQuery ));

(function($) {
	$.widget("cg.fdl",{
		score:0,
		hiScore:0,
		provsCatalog:[
			"Tierra del Fuego, Antártida e Islas del Atlántico Sur",//0
			"Santa Cruz",
			"Chubut",
			"Neuguén",
			"Río Negro",//4
			"La Pampa",
			"Buenos Aires",
			"Mendoza",
			"San Luis",//8
			"Entre Ríos",
			"Córdoba",
			"San Juan",
			"Santa Fe",//12
			"La Rioja",
			"Tucumán",
			"Corrientes",
			"Santiago del Estero",//16
			"Misiones",
			"Catamarca",
			"Chaco",
			"Formosa",//20
			"Salta",
			"Jujuy",
			"CABA"//23
		],
		widgetEventPrefix: "fdl:",
		options: {
			labels: {}
		},
		_create: function() {
			$('.box', this.element).centrar();

			//todos los splash ocultos... ojo
			TweenMax.set('#mainContainer > div',{autoAlpha:0});

			this.callToAction = $('#callToAction', this.element);
			this.guideSplash = $('#guideSplash', this.element);
			this.selectSplash = $('#selectSplash', this.element);
			this.triviaContainer = $('#triviaContainer', this.element);
			this.mapContainer = $('#map', this.element);
			this.statusBar = $('#statusBar', this.element);
			this.hiScore = parseInt(store.get('fdl_hiScore')) || 0;
			$('p.hiScore', this.statusBar).html("Puntaje más alto: "+this.hiScore);

			TweenMax.set(this.statusBar,{autoAlpha:1});

			var _this = this;
			$.when(
				(function(){
					return $.ajax({
						url: 'argentina.svg',
						dataType: 'html'
					}).done(function(text){
						//_this.mapContainer.html(text);
					});
				})(),
				this._loadQuestions()
			).then(
				function(datasvg, datajson){
					// console.log(arguments);
					_this.mapContainer.html(datasvg[0]);
					_this.svg = $('svg', _this.mapContainer);
					_this.questionsCatalog = datajson[0].questions;
					_this.answersCatalog = datajson[0].options;
					_this._prepareStuff();
				},
				function(err) {
					console.log('error');
					console.log(arguments);
				}
			);
		},
		_shuffleArray: function(o){ 
			for(var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x){}
			return o;
		},
		_prepareStuff: function() {
			var _this = this;
			//trimeo las opciones, por las dudas
			$.each(this.answersCatalog, function(i,e){
				$.each(e, function(ii,ee){
					e[ii] = ee.trim();
				});
			});
			// console.log(this.answersCatalog);

			//agrego categorias a las preguntas
			$.each(this.questionsCatalog, function(i,e){
				e.options = _this.answersCatalog[i];
				e.correctAnswer = e.correctAnswer.trim();
				if(e.options.indexOf(e.correctAnswer) < 0) {
					console.log('La respuesta correcta no corresponde a ninguna de las opciones');
					console.log('"'+e.correctAnswer+'"');
					console.log(e.options);
				}
			});
			window.tete = this.questionsCatalog;

			//shuffle de provincias para animacion copada
			var provs = this._shuffleArray($('.provincia',this.svg).remove());
			this.svg.prepend(provs);

			var _this = this;
			d3.selectAll('.provincia')
				.on('click', function(){
					// var $this = d3.select(this);
					_this._trigger('provincia:clicked',null,{provincia:this});
				});

			this.element.on('fdl:provincia:clicked',function provinciaHandler(evt, data) {
				console.log("evento clicked en provincia - dummy");
			});
			this.startGame();
		},
		_loadQuestions: function(callback) {
			var _this = this;
			var d = $.Deferred(function(defer){
				$.getJSON('triviafile2.json').then(defer.resolve, defer.reject);
			}).promise();
			return d.done(callback);
		},
		startGame: function() {
			var _this = this;
			this.score = 0;
			$('.provincia').data('respondida',false);
			var tl = new TimelineMax({onComplete:function(){
				_this.callToAction.one('click', $.proxy(_this._startRound, _this));
			}})
			tl.set('.provincia',{autoAlpha:0,fill:'#fea'});
			tl.staggerTo([_this.mapContainer, _this.callToAction],1,{autoAlpha:1},0.5);
			tl.staggerTo('.provincia',0.5,{autoAlpha:0.5,fill:'#fff',ease:RoughEase.ease},0.05);
			tl.set('.provincia',{transformOrigin:"240px 973px",fill: "#fff"});
			// $.each($('.provincia'), function(i,e){
			// 	$(e).data('respondida',false);
			// 	TweenMax.from(e,2.5,{rotation:((Math.random() < 0.5) ? 90 : -90),ease:Elastic.easeOut,delay:0.5 + i * 0.06});
			// 	// TweenMax.from(e,2.4,{rotation:90,ease:Elastic.easeOut,delay:0.5 + i * 0.06});
			// 	// TweenMax.from(e,2.4,{y:-1000,ease:Elastic.easeOut,delay:0.5 + i * 0.06});
			// });
		},
		// _showGuideSplash: function() {
		// 	var _this = this;
		// 	var tl = new TimelineMax({
		// 		onComplete: function setGuideHandler(){
		// 			_this.guideSplash.one('click', $.proxy(_this._startRound, _this));
		// 		}
		// 	});

		// 	tl.to(this.callToAction,0.5,{autoAlpha:0});
		// 	tl.to(this.guideSplash,0.5,{autoAlpha:1});
		// },
		_restart: function() {
			TweenMax.to(this.svg,1,{scale:1,x:0,y:0,ease:Back.easeInOut});
			TweenMax.to(this.selectSplash,0.5,{autoAlpha:0});
			this.startGame();
		},
		_startRound: function() {
			var _this = this;
			// console.log(this.svg);
			var tl = new TimelineMax({
				onComplete: function (){
					_this.element.on('fdl:provincia:clicked',function select(evt, data){
						if($(data.provincia).data('index') == 23 || $(data.provincia).data('respondida') == true) return;
						_this.element.off('fdl:provincia:clicked',select);
						// console.log($(data.provincia).data('index'));
						_this._startTrivia($(data.provincia).data('index'));
					});
				}
			});
			tl.to(this.callToAction,0.5,{autoAlpha:0});
			tl.to(this.svg,1,{scale:2,x:-10,y:430,ease:Back.easeInOut});
			tl.to(this.selectSplash,0.5,{autoAlpha:1});
		},
		_startTrivia: function(category) {
			var preguntas = this._filterQuestionsByCategory(category);
			// console.log(preguntas);
			var _this = this;
			var provincia = $('.provincia[data-index='+category+']');
			provincia.data('respondida',true);
			var respondido = false;
			// _this.options.labels.finalScore = "Tu puntaje para el desafío "
			// 	+provincia.data('name')
			// 	+ " es: ";
			var imgProv = $('<img src="images/provincias/'+category+'.png" />').css({
				position: 'absolute',
				top: 0,
				left: 0,
				width: '480px',
				height: '378px'
			});
			var imgQuestion = $('<img />').css({
				position: 'absolute',
				top: '378px',
				left: 0,
				width: '965px',
				height: '616px'
			});
			TweenMax.set(imgQuestion,{autoAlpha:0});
			TweenMax.to(this.triviaContainer,0.5,{
				autoAlpha:1,
				onComplete: function(){
					var miniTrivia = $('<div id="trivia" />').appendTo(_this.triviaContainer);
					miniTrivia.height('100%');
					miniTrivia.trivia({
						questions: preguntas,
						questionsPerGame: 3,
						scorePerQuestion: 1,
						useStore: false,
						timeBonus: false,
						useTemplate: false,
						mindTheHiScore: false,
						beforeShowQuestion: function(evt, data) {
							//cargar imagen de pregunta
							TweenMax.to(imgProv,0.25,{autoAlpha:1});
							//aca hay que llamar al data.question.id o lo que sea que identifique
							//la foto que corresponde a la imagen
							imgQuestion.attr('src','images/fotos/6.png').appendTo(data.instance.gameSpace);
							TweenMax.to(imgQuestion,0.25,{autoAlpha:1,delay:2});
						},
						afterShowQuestion: function(evt, data) {
							respondido = false;
							var timeDonut = $('<div id="donut" class="absolute" />').appendTo(miniTrivia);
							timeDonut.width(100).height(100).centrar({vertical:false});

							var tl = new TimelineMax({onComplete: function() {
								timeDonut.remove();
								if(!respondido)
									data.instance.respond('rrr',true,'Voce a perdutto ma uma falta da tempo!');
							}});
							tl.set(timeDonut,{transformOrigin:"center center"});
							tl.add(_this._makeDonutTimer('#donut',5));
							tl.add(TweenMax.to(timeDonut,0.2,{scale:1.3,yoyo:true,repeat:1,ease:Back.easeIn}),1);
							tl.add(TweenMax.to(timeDonut,0.2,{scale:1.3,yoyo:true,repeat:1,ease:Back.easeIn}),2);
							tl.add(TweenMax.to(timeDonut,0.2,{scale:1.3,yoyo:true,repeat:1,ease:Back.easeIn}),3);
							tl.add(TweenMax.to(timeDonut,0.2,{scale:1.3,yoyo:true,repeat:1,ease:Back.easeIn}),4);
							data.instance.tweenRoot = tl;
						},
						answered: function(evt, data) {
							TweenMax.set('#donut',{transformOrigin:"center center"});
							TweenMax.to('#donut',0.25,{scale:0,autoAlpha:0,ease:Back.easeIn});
							TweenMax.to(imgProv,0.25,{autoAlpha:0});
							TweenMax.to(imgQuestion,0.25,{autoAlpha:0});
							respondido = true;
							if(data.correcto) {
								this.score += 1;
								if(this.score > this.hiScore) {
									store.set('fdl_hiScore',this.score);
									$('p.hiScore',this.statusBar).html("Puntaje más alto: "+this.hiScore);
								}
							}
						},
						error: function(evt, data) {
							console.log(data);
						},
						gamespaceBuilt: function(evt, data) {
							$('#hiScoreBox',miniTrivia).remove();
							data.instance.gameSpace.append(imgProv);
							TweenMax.set(imgProv,{autoAlpha:0});
						},
						gameEnded: function(evt, data) {
							//esto sucede antes de mostrar el cartel final de la trivia
							if(data.score > 1) {
								$('.finalScoreLabel',data.instance.endSplash).html("¡Enhorabuena!<br />Superaste el desafío "
									+ provincia.data('name') + "<br /><br />"
									+"Podés seleccionar otra provincia para seguir sumando puntos");
							}else{
								$('.finalScoreLabel',data.instance.endSplash).html("Debés esforzarte más<br />Necesitás al menos 2 "
									+"estrellas para superar el desafío " +provincia.data('name')
									+"<br /><br />Probá otra vez");
							}
						},
						gameReady: function(evt, data) {
							console.log('preguntas de '+provincia.data('index'));
							data.instance.startGame();
						},
						gameStarted: function(evt, data) {
							console.log('trivia game started');
						},
						gameRestart: function(evt, data) {
							TweenMax.to(_this.triviaContainer,1,{autoAlpha:0, onComplete:function(){
								miniTrivia.trivia("destroy");
								_this.triviaContainer.html("");
								console.log(data);
								var color = data.score > 1 ? '#2f2' : '#f00';
								var tl = new TimelineMax({onComplete: function(){
									if(data.score < 2) {
										_this.startGame();
									}else{
										_this.element.on('fdl:provincia:clicked',function select(evt, data){
											if($(data.provincia).data('index') == 23 || $(data.provincia).data('respondida') == true) return;
											_this.element.off('fdl:provincia:clicked',select);
											// console.log($(data.provincia).data('index'));
											_this._startTrivia($(data.provincia).data('index'));
										});
									}
								}});
								tl.set(provincia,{transformOrigin: "center center"});
								tl.to(provincia, 1.5, {scale: 2});
								tl.to(provincia,1.5,{fill:color},0);
								tl.to(provincia,0.5,{scale:1,ease:Bounce.easeOut});
								if(data.score < 2) {
									tl.staggerTo('.provincia',0.5,{autoAlpha:0,fill:'#f00',ease:RoughEase.ease},0.05);
									tl.to(_this.selectSplash,0.25,{autoAlpha:0});
									tl.to(_this.svg,1,{scale:1,x:0,y:0,ease:Back.easeInOut});
								}
								//aca hay que volver a la seleccion, argegar la prov a un array
								//y volver a bindear el evento clicked
							}})
						},
						labels: _this.options.labels
					});
				}
			});
		},
		_setUpTimelines: function() {

		},
		_filterQuestionsByCategory: function(category) {
			return this.questionsCatalog.filter(function(q){
				return q.provinciaId == category;
			});
		},
		_makeDonutTimer: function(selector, seconds) {
			var margin = {top: 0, right: 0, bottom: 0, left: 0};
				width = 100 - margin.left - margin.right;
				height = width - margin.top - margin.bottom;

			var chart = d3.select(selector)
				.append('svg')
				.attr("width", width + margin.left + margin.right)
				.attr("height", height + margin.top + margin.bottom)
				.append("g")
				.attr("transform", "translate(" + ((width/2)+margin.left) + "," + ((height/2)+margin.top) + ")");


			var radius = Math.min(width, height) / 2;

			var arc = d3.svg.arc()
				.startAngle(0)
				.endAngle(0.1)
				.outerRadius(radius)
				.innerRadius(radius - 10);

			var timer = chart.append('path')
				.style("fill",'#fff')
				.attr('id','timer')
				.attr('d',arc);

			var angle = {end:0};

			return TweenMax.to(angle,seconds,{end:360,ease:Linear.easeNone,onUpdate: function(){
				arc.endAngle(angle.end * (Math.PI / 180));
				timer.attr('d',arc);
			}});
		}
	});
})( jQuery );
