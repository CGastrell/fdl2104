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
			top: settings.horizontal ? this.offset().top : (container.innerHeight() - this.outerHeight()) / 2,
			left: (container.innerWidth() - this.outerWidth()) /2
		}
		return this.offset(n);
	};

}( jQuery ));

(function($) {
	$.widget("cg.fdl",{
		provsCatalog:[
			"Tierra del Fuego, Antártida e Islas del Atlántico Sur",
			"Santa Cruz",
			"Chubut",
			"Neuguen",
			"Rio Negro",//4
			"La Pampa",
			"Buenos Aires",
			"Mendoza",
			"San Luis",//8
			"Entre Rios",
			"Cordoba",
			"San Juan",
			"Santa Fe",//12
			"La Rioja",
			"Tucuman",
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
			//agrego categorias a las preguntas
			$.each(this.questionsCatalog, function(i,e){
				e.category = Math.random() < 0.5 ? 6 : 7;
			});

			//limpieza
			// $('g',this.svg).remove();
			// $('.boundary',this.svg).remove();

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
				$.getJSON('triviafile.json').then(defer.resolve, defer.reject);
			}).promise();
			return d.done(callback);
		},
		startGame: function() {
			var _this = this;
			TweenMax.staggerTo([_this.mapContainer, _this.callToAction],1,{autoAlpha:1},0.5);
			// TweenMax.staggerFrom('.provincia',0.5,{autoAlpha:0,fill:'#ff0',ease:RoughEase.ease,delay:1.5},0.05);
			TweenMax.set('.provincia',{transformOrigin:"240px 973px"});
			$.each($('.provincia'), function(i,e){
				TweenMax.from(e,2.5,{rotation:((Math.random() < 0.5) ? 90 : -90),ease:Elastic.easeOut,delay:0.2 + i * 0.06});
				// TweenMax.from(e,2.4,{rotation:90,ease:Elastic.easeOut,delay:0.5 + i * 0.06});
				// TweenMax.from(e,2.4,{y:-1000,ease:Elastic.easeOut,delay:0.5 + i * 0.06});
			});
			this.callToAction.one('click', $.proxy(this._startRound, this));
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
						if($(data.provincia).data('index') == 23) return;
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
			console.log(preguntas);
			var _this = this;
			var provincia = $('.provincia[data-index='+category+']');
			TweenMax.to(this.triviaContainer,0.5,{
				autoAlpha:1,
				onComplete: function(){
					var miniTrivia = $('<div id="trivia" />').appendTo(_this.triviaContainer);
					miniTrivia.height('100%');
					miniTrivia.trivia({
						questions: preguntas,
						questionsPerGame: 3,
						scorePerQuestion: 1,
						useTemplate: false,
						error: function(evt, data) {
							console.log(data);
						},
						gameReady: function(evt, data) {
							data.instance.startGame();
						},
						gameStarted: function(evt, data) {
							console.log(data);
						},
						gameRestart: function(evt, data) {
							TweenMax.to(_this.triviaContainer,0.5,{autoAlpha:0, onComplete:function(){
								miniTrivia.trivia("destroy");
								_this.triviaContainer.html("");
								console.log(data);
								var color = data.score > 1 ? '#2f2' : '#f00';
								TweenMax.to(provincia,1,{fill:color});
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
				return q.category == category;
			});
		}
	});
})( jQuery );
