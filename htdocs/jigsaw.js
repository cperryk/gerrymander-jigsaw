$(function(){
	// top-level variables and constants
	var dragging = false, //true if the user is currently dragging a district
		selecting = false, //true if the user has a district selected
		hover_district, //the district the user is currently hovering over
		DEFAULT_SHAPE_STYLE = {
			fill: '#cccccc',
			opacity: '0.9',
			"fill-rule": 'evenodd',
			stroke: '#000000',
			"stroke-width": '0.33',
			"stroke-linecap": 'square',
			"stroke-liknejoin": 'bevel',
			"stroke-miterlimit": '4',
			"stroke-dasharray": 'none',
			"stroke-opacity": '1'
		},
		VALIDATION_LEEWAY = 15, //how close each piece has to be to the correct X and Y coordinates for the puzzles to solve
		PUZZLE_WIDTH = 920,
		PUZZLE_HEIGHT = 650,
		GBCR_CONSIDERS_TRANSFORM = gbcrConsidersTransform('int_raphael_canvas'), //compatability issue; see function gbcrConsidersTransform
		FACEBOOK_SHARE_IMG_SRC = 'http://slate.com/features/2013/08/jigsaw/graphics/jigsaw_facebook_share_thumb.png',
		SELECTED_LOCATIONS = { //the initial positions of the broken congressional districts
			'PA': {"0":{"x":567,"y":572},"1":{"x":224,"y":134},"2":{"x":27,"y":454},"3":{"x":510,"y":474},"4":{"x":597,"y":426},"5":{"x":736,"y":344},"6":{"x":86,"y":375},"7":{"x":456,"y":572},"8":{"x":292,"y":10},"9":{"x":10,"y":6},"10":{"x":722,"y":6},"11":{"x":535,"y":14},"12":{"x":847,"y":328},"13":{"x":154,"y":115},"14":{"x":363,"y":493},"15":{"x":230,"y":534},"16":{"x":758,"y":155},"17":{"x":13,"y":297}},
			'MD':{"0":{"x":147,"y":299},"1":{"x":41,"y":130},"2":{"x":256,"y":86},"3":{"x":187,"y":34},"4":{"x":141,"y":433},"5":{"x":419,"y":5},"6":{"x":612,"y":512},"7":{"x":765,"y":500}},
			'OH':{"0":{"x":774,"y":489},"1":{"x":346,"y":1},"2":{"x":841,"y":397},"3":{"x":591,"y":396},"4":{"x":704,"y":38},"5":{"x":0,"y":41},"6":{"x":713,"y":199},"7":{"x":0,"y":8},"8":{"x":290,"y":592},"9":{"x":571,"y":6},"10":{"x":869,"y":458},"11":{"x":234,"y":14},"12":{"x":782,"y":556},"13":{"x":126,"y":344},"14":{"x":12,"y":505},"15":{"x":12,"y":215}},
			'IA':{"0":{"x":30,"y":394},"1":{"x":583,"y":454},"2":{"x":665,"y":35},"3":{"x":23,"y":16}},
			'NC':{"0":{"x":320,"y":461},"1":{"x":19,"y":5},"2":{"x":15,"y":122},"3":{"x":806,"y":92},"4":{"x":142,"y":505},"5":{"x":519,"y":510},"6":{"x":736,"y":425},"7":{"x":220,"y":42},"8":{"x":402,"y":28},"9":{"x":738,"y":5},"10":{"x":470,"y":19},"11":{"x":812,"y":280},"12":{"x":11,"y":514}},
			'MI':{"0":{"x":609,"y":365},"1":{"x":133,"y":7},"2":{"x":12,"y":39},"3":{"x":18,"y":365},"4":{"x":805,"y":76},"5":{"x":683,"y":187},"6":{"x":0,"y":192},"7":{"x":702,"y":4},"8":{"x":838,"y":595},"9":{"x":565,"y":17},"10":{"x":522,"y":18},"11":{"x":718,"y":581},"12":{"x":816,"y":549},"13":{"x":11,"y":586}}
		},
		CUSTOM_SCALES = { //how each state is scaled (optional but recommended)
			'OH':5,
			'MD':7,
			'IA':3.5,
			'PA':4.5,
			'NC':4,
			'MI':5
		};
	/*
		Four objects wrap most of the code: Interactive, Puzzle, State, and Congressional_District Shape.
		
		"Interactive" contains all top-level functions, like advancing to the next "frame" or modifying
		elements of the UI to reflect an updated score, time, etc.

		"Puzzle" contains functions related to the current puzzle. For example, it draws district shapes
		on the page and removes districts shapes from the page.

		"State" contains data related to the user's activity on each state puzzle, such as whether it
		is solved, the current locations of the districts in the state, and the user's completion time
		if the state has been solved.

		"Congressionial_District_Shape" objects contain the actual raphael objects of the congressional districts
		as well as a variety of functions for manipulating them -- dragging them, highlighting
		them, checking to see if they are positioned correctly yet, etc.

	*/
	function Interactive(){
		this.states = [
			new State('IA','Iowa'),
			new State('MI','Michigan'),
			new State('NC','North Carolina'),
			new State('PA','Pennsylvania'),
			new State('MD','Maryland'),
			new State('OH','Ohio')
		];
		this.container = $('#interactive');
		this.objs = //html elements related to the interactive that are referenced multiple times
			{
				puzzle_solved:$('#puzzle_solved'),
				quiz_end:$('#quiz_end'),
				interactive_footer:$('#interactive_footer'),
				location_readout_here:$('#location_readout_here'),
				btn_back:$('#btn_back'),
				btn_next:$('#btn_next'),
				interactive_nav_title:$('#interactive_nav_title'),
				puzzles_length_here:$('#puzzles_length_here'),
				puzzle_begin:$('#puzzle_begin'),
				puzzle_solved_btn_next:$('#puzzle_solved_btn_next'),
				blurbs:$('#blurbs'),
				btn_facebook_share:$('#btn_fb_share'),
				btn_twitter_share:$('#btn_tw_share'),
				puzzle_disclaimer:$('#puzzle_disclaimer'),
				interactive_nav_time:$('#interactive_nav_time'),
				you_solved_share_btns:$('#you_solved_share_btns')
			};
		this.timer = new Interactive_Timer(this);
		this.puzzle = new Puzzle(this);
		this
			.goToLocation(0)
			.addEventListeners()
			.addShiftListener();
		this.tooltip = new Tooltip('interactive_tooltip',this);
		this.objs.puzzles_length_here.html(this.states.length);
	}
	Interactive.prototype = {
		goToLocation:function(locationIndex){ //go to a new "frame," either a new state puzzle or the end frame
			this.currentLocation = locationIndex;
			resetElements(this);
			routeLocation(this);
			setLocationReadout(this);
			setNavigationButtons(this);
			function resetElements(self){
				var objs = self.objs;
				objs.puzzle_solved
					.add(objs.quiz_end)
					.add(objs.interactive_footer)
					.hide();
				self.timer.stop();
				if(self.tooltip){self.tooltip.hide();}
				self.puzzle.canvas_jquery.css('height',650);
				objs.interactive_nav_title.hide();
				objs.interactive_nav_time.hide();
				objs.you_solved_share_btns.hide();
			}
			function routeLocation(self){ //determine whether to load a state frame or the final frame
				if(locationIndex<self.states.length){
					self.loadState(locationIndex);
				}
				else if(locationIndex==self.states.length){
					self.loadEnd();
				}
			}
			function setLocationReadout(self){ //alter UI to reflect new location
				var readout_text = '';
				if(locationIndex==self.states.length){
					readout_text = 'End';
				}
				else{
					readout_text = 'Puzzle '+(locationIndex+1)+' of '+self.states.length;
				}
				self.objs.location_readout_here.html(readout_text);
			}
			function setNavigationButtons(self){ //show the back or next buttons as necessary
				var objs = self.objs;
				objs.btn_back
					.add(self.btn_next)
					.removeClass('inactive');
				if(locationIndex==self.states.length){
					objs.btn_next.addClass('inactive');
				}
				else{
					if(locationIndex===0){
						objs.btn_back.addClass('inactive');
					}
					if(!self.current_state.isSolved){
						objs.btn_next.addClass('inactive');
					}
				}
			}
			return this;
		},
		loadState:function(locationIndex){ //prepare the UI for a state puzzle, and activate the puzzle
			var objs = this.objs;
			objs.interactive_nav_title.show();
			objs.interactive_nav_time.show();
			this.current_state = this.states[locationIndex];
			objs.interactive_nav_title.html(this.current_state.fullName);
			this.timer.displayTime(this.current_state.timeCount);
			this.puzzle
				.loadState(this.current_state.state_code,this.current_state.isSolved);
			if(this.current_state.isSolved){ //if the state is already solved, mark it accordingly
				this.markSolved();
			}
			else{ //if it's unsolved, start the timer
				this.timer.start(locationIndex);
			}
			if(this.current_state.state_code == 'MI' && this.current_state.isSolved===false){
				objs.puzzle_disclaimer.show();
			}
			else{
				objs.puzzle_disclaimer.hide();
			}
		},
		loadEnd:function(){ //load the final frame (results)
			if(!this.user_time){
				this.user_time = getFinalTime(this);
				displayFinalTime(this);
			}
			if(!this.score_sent){
				sendScore(this);
			}
			if(!this.score_loaded){
				loadScore(this);
			}
			if(!this.share_listeners_on){
				addShareListeners(this);
			}
			this.objs.quiz_end.show();
			function getFinalTime(self){
				var user_time = 0;
				for(var i=1;i<self.states.length;i++){
					user_time+=self.states[i].timeCount;
				}
				return user_time;
			}
			function displayFinalTime(self){
				var time_string = Interactive_Timer.getTimeStringLong(self.user_time);
				$('#final_score_here').html(time_string);
			}
			function sendScore(self){
				self.score_sent = true;
				var url = 'http://slate-interactives-prod.elasticbeanstalk.com/scores/addScore.php?interactiveID=jigsaw1&score='+self.user_time+'&callback=?';
				$.ajax({
					dataType:'jsonp',
					url:url
				});
			}
			function loadScore(self){
				var url = 'http://slate-interactives-prod.elasticbeanstalk.com/scores/getScores.php?interactiveID=jigsaw1&callback=?';
				self.score_loaded = true;
				$.ajax({
					dataType:'jsonp',
					url:url,
					success:function(data){
						$('#average_score_here').html(Interactive_Timer.getTimeStringLong(data.average));
					},
					error:function(){
						$('#average_score_here').html('Could not load; please check back later');
					}
				});
			}
			function addShareListeners(self){
				var time_string = Interactive_Timer.getTimeStringLong(self.user_time);
				self.objs.btn_facebook_share.click(function(){
					facebookShare(time_string);
				});
				self.objs.btn_twitter_share.click(function(){
					twitterShare(time_string);
				});
				self.share_listeners_on = true;
			}
		},
		addEventListeners:function(){
			var self = this;
			// btn_next
			this.objs.btn_next
				.add(this.objs.puzzle_solved_btn_next)
				.click(function(){
					if(!$(this).hasClass('inactive')){
						self.goToLocation(self.currentLocation+1);
					}
			});
			//btn_back
			this.objs.btn_back.click(function(){
				if(!$(this).hasClass('inactive')){
					self.goToLocation(self.currentLocation-1);
				}
			});
			//share buttons at the end of the quiz
			this.objs.you_solved_share_btns
				.find('#you_solved_facebook_share')
					.click(function(){
						facebookShare(Interactive_Timer.getTimeStringLong(self.current_state.timeCount),self.current_state);
					})
					.end()
				.find('#you_solved_twitter_share')
					.click(function(){
						twitterShare(Interactive_Timer.getTimeStringLong(self.current_state.timeCount),self.current_state);
					});
			return this;
		},
		markSolved: function(){ //mark a state frame as solved
			if(this.current_state.state_code == 'MI'){
				this.objs.puzzle_disclaimer.hide();
			}
			var time_string;
			this.puzzle.unselectShapes();
			if(this.currentLocation===0){
				this.objs.puzzle_begin
					.hide();
				raiseSolved(this,'You solved the tutorial puzzle! Click <span style="font-style:italic">NEXT</span> to start the game.',getBlurb(this));
			}
			else{
				time_string = Interactive_Timer.getTimeStringLong(this.current_state.timeCount)+'.';
				raiseSolved(this,'You solved the puzzle in <strong>'+time_string, getBlurb(this)+'</strong>');
				addBlurbListener(this);
				this.objs.you_solved_share_btns.show();
			}
			this.puzzle.removeDragListeners();
			this.puzzle.addHoverListeners();
			if(!this.current_state.isSolved){
				this.puzzle.organizeSolution();
				this.current_state.isSolved = true;
			}
			this.puzzle.canvas_jquery.css('height',this.current_state.canvas_height); //make sure the size of the interactive can contain the new state
			function raiseSolved(self,you_solved_string,blurb){
				self.objs.puzzle_solved
					.find('#you_solved')
						.html(you_solved_string)
						.end()
					.find('#puzzle_solved_blurb')
						.html(blurb)
						.end()
					.show();
				self.objs.btn_next.removeClass('inactive');
			}
			function getBlurb(self){ //the "blurb" is the explanatory text associated with each state that appears after it has been solved.
				var state_code = self.current_state.state_code;
				return self.objs.blurbs.find('#'+state_code).html();
			}
			function addBlurbListener(self){ //add hover listeners to the district references in the explainer (blurb) text
				self.objs.puzzle_solved
					.find('.districtLink')
					.unbind()
					.hover(function(){
						var district_code = $(this).data('target');
						if(typeof district_code == 'number'){
							if(district_code<10){
								district_code = '0'+district_code;
							}
						}
						self.puzzle.selectDistrict(district_code).highlight();
					},function(){
						self.tooltip.hide();
						var district_code = $(this).data('target');
						if(typeof district_code == 'number'){
							if(district_code<10){
								district_code = '0'+district_code;
							}
						}
						self.puzzle.selectDistrict(district_code).unhighlight();
					});
			}
			return this;
		},
		storeLocations:function(){
			/* Save the locations of all the printed districts */
			var shapes = this.puzzle.printed_shapes;
			var l = shapes.length;
			for(var a=0;a<l;a++){
				var bbox = fauxGetBbox(shapes[a].raphael_object);
				this.current_state.setLocation(a,{x:Math.round(bbox.x),y:Math.round(bbox.y)});
			}
		},
		addShiftListener:function(){ //listen for a shift press for multiple district selection
			var self = this;
			this.shifted = false;
			$(document)
				.keydown(function (e) {
					if (e.keyCode == 16) {
						self.shifted = true;
					}
				})
				.keyup(function (e) {
					if (e.keyCode == 16){
						self.shifted = false;
					}
				});
			return this;
		},
		storeCanvasHeight:function(){
			var h1 = fauxGetBbox(this.puzzle.state_outline).height + 40;
			this.current_state.canvas_height = h1;
		}
	};
	function State(state_code,fullName){
		this.state_code = state_code;
		this.isSolved = false;
		this.locations = {};
		this.colors = {};
		this.timeCount = 0;
		this.fullName = fullName;
	}
	State.prototype.setLocation = function(district_code,coords){
		// Save the location of a district
		this.locations[district_code] = coords;
	};
	function Interactive_Timer(parent){
		this.timerObj = $('#current_time_here');
		this.par = parent;
		this.totalTime = 0;
	}
	Interactive_Timer.prototype = {
		start: function(){
			this.interval = setInterval(tick,1000);
			var self = this;
			var par = this.par;
			var current_state = par.states[par.currentLocation];
			if(!current_state.timeCount){
				current_state.timeCount = 0;
			}
			function tick(){
				current_state.timeCount++;
				self.displayTime(par.states[par.currentLocation].timeCount);
			}
			return this;
		},
		stop: function(){
			if(this.interval){
				clearInterval(this.interval);
			}
			return this;
		},
		displayTime: function(time){
			this.timerObj.html(Interactive_Timer.getTimeString(time));
		}
	};
	Interactive_Timer.secondsToMMSS = function(seconds){
		var minutes = Math.floor(seconds / 60);
		seconds = seconds - minutes * 60;
		return {minutes:minutes,seconds:seconds};
	};
	Interactive_Timer.getTimeString = function(time){
		if(!time){
			return '00:00';
		}
		else{
			var time_string = Interactive_Timer.secondsToMMSS(time);
			if(time_string.minutes===0){
				time_string.minutes='00';
			}
			if(time_string.seconds<10){
				time_string.seconds='0'+time_string.seconds;
			}
			return time_string.minutes+':'+time_string.seconds;
		}
	};
	Interactive_Timer.getTimeStringLong = function (time){
		var minutesString = '';
		var secondsString = '';
		var s = '';
		time = Interactive_Timer.secondsToMMSS(time);
		if(time.minutes==1){
			minutesString = '1 minute';
		}
		else if(time.minutes>1){
			minutesString = time.minutes+' minutes';
		}
		if(time.seconds==1){
			secondsString ='1 second';
		}
		else if(time.seconds>1){
			secondsString =time.seconds+' seconds';
		}
		if(minutesString&&secondsString){
			s = minutesString+' and '+secondsString;
		}
		else if(minutesString){
			s = minutesString;
		}
		else if(secondsString){
			s = secondsString;
		}
		return s;
	};
	function Puzzle(parent){
		this.canvas = Raphael('int_raphael_canvas',PUZZLE_WIDTH,PUZZLE_HEIGHT);
		this.canvas_jquery = $('#int_raphael_canvas');
		this.selected_shapes = [];
		this.par = parent;
	}
	Puzzle.prototype = {
		loadState:function(state_code,is_solved){
			this.state_code = state_code;
			if(this.tooltip){
				this.tooltip.hide();
			}
			this.clear();
			if(!is_solved){
				this.drawStateOutline(state_code); //draw the gray state outline
			}
			this.setScaleString(is_solved);
			this.printShapes(state_code);
			this.getValidators();
			if(!is_solved){
				this
					.addEventListeners();
			}
			this.placeDistricts(state_code,is_solved);
		},
		setScaleString:function(){ 
			/*	
				The scale string determines how the district shapes will be scaled.
				Custom scale factors are set in CUSTOM_SCALES.
				If no custom factors are specified, the program will automatically scale the
				shapes based on the width and height of the interactive. Specifying custom
				factors is strongly recommended because the automatic scaling process
				has poor performance on FireFox.
			*/
			if(!this.par.current_state.scale_string){
				if(CUSTOM_SCALES[this.state_code]){
					scaleFactor = CUSTOM_SCALES[this.state_code];
				}
				else{
					var set = this.state_outline;
					var bbox = fauxGetBbox(set);
					var width = bbox.width;
					var height = bbox.height;
					var newWidth;
					var newHeight;
					if(width>=height){
						scaleFactor = (PUZZLE_HEIGHT-10)/width;
					}
					else if(height>width){
						scaleFactor = (PUZZLE_HEIGHT-10)/height;
					}
				}
				this.scaleFactor = scaleFactor;
				var scale_string = 's'+scaleFactor+','+scaleFactor+',0,0';
				this.par.current_state.scale_string = scale_string;
			}
			this.scale_string = this.par.current_state.scale_string;
		},
		addEventListeners:function(){
			var self = this;
			$('#int_raphael_canvas')
				.unbind('mousedown')
				.mousedown(function(e){
					if(e.target.style.cursor!=='move' && e.which!=3){
						self.unselectShapes();
					}
				});
			return this;
		},
		unselectShapes:function(){
			var selected_shapes = this.selected_shapes;
			if(this.selected_shapes){
				for(var i=selected_shapes.length-1;i>-1;i--){
					selected_shapes[i].unselectShape();
				}
				this.selected_shapes = [];
			}
		},
		drawStateOutline:function(state_code){
			var self = this;
			var set = this.canvas.set();
			this.state_outline = set;
			drawCDs();
			this.setScaleString();
			placeStateOutline();
			storeValidationPoint();
			this.par.storeCanvasHeight();
			function drawCDs(){
				for(var district_code in CDS[state_code]){
					var cd = self.canvas.path(CDS[state_code][district_code])
							.attr({'fill':'#c7c7c7','stroke':'#c7c7c7','stroke-width':'1.5',opacity:1,'cursor':'default'});
					set.push(cd);
				}
			}
			function placeStateOutline(){
				set.transform(self.scale_string);
				var bbox = fauxGetBbox(set);
				var targetx = (PUZZLE_WIDTH/2)-(bbox.width/2);
				var targety = (PUZZLE_HEIGHT/2)-(bbox.height/2);
				var tstring = '...T-'+((bbox.x)-targetx)+',-'+((bbox.y)-targety);
				set.transform(tstring);
			}
			function storeValidationPoint(){
				var a = fauxGetBbox(set.items[0]);
				self.validation_point = {x:a.x,y:a.y};
			}
			return this;//draw the gray state outline
		},
		printShapes:function(state_code){
			this.printed_shapes = [];
			for(var district_code in CDS[state_code]){
				this.printed_shapes.push(new Congressional_District_Shape(this,state_code,district_code));
			}
			return this;
		},
		placeDistricts:function(state_code,isSolved){
			for(var i=0;i<this.printed_shapes.length;i++){
				this.printed_shapes[i].placeDistrict(state_code,i,isSolved);
			}
			return this;
		},
		getValidators:function(){
			this.printed_shapes[0].getValidators();
			return this;
		},
		checkAnswer:function(){
			var answer_correct = this.printed_shapes[0].validatePlacements();
			if(answer_correct){
				this.par
					.markSolved()
					.timer
						.stop();
			}
		},
		clear:function(){
			var self = this;
			this.canvas.clear();
			Raphael.getColor.reset();
			clearEventListeners();
			function clearEventListeners(){
				self.canvas_jquery
					.unbind('mousedown');
				$(document)
					.unbind('mouseup')
					.unbind('mousemove');
			}
			return this;
		},
		addHoverListeners:function(){
			var self = this;
			var tooltip = this.par.tooltip;
			for(var i=this.printed_shapes.length-1;i>=0;i--){
				var shape = this.printed_shapes[i].raphael_object;
				for(var a=shape.events.length-1;a>=0;a--){
					shape.events[a].unbind();
				}
				shape
					.hover(mouseIn,mouseOut)
					.mousemove(mouseMove);
			}
			return this;
			function mouseIn(e){
				if(!this.mouseovered){
					if(hover_district){
						hover_district.attr({'stroke-width':DEFAULT_SHAPE_STYLE['stroke-width']});
						hover_district.mouseovered = false;
						hover_district.district_set = false;
					}
					hover_district = this;
					this.mouseovered = true;
					e = e || window.event;
					e = jQuery.event.fix(e);
					tooltip
						.setDistrict(this.par.district_code)
						.showAtCoordinates(e.pageX,e.pageY);
					this
						.attr({'stroke-width':2})
						.toFront();
					this.district_set = true;
				}
			}
			function mouseMove(e){
				if(!this.district_set){
					tooltip.setDistrict(this.par.district_code);
					this.district_set = true;
				}
				e = e || window.event;
				e = jQuery.event.fix(e);
				tooltip
					.showAtCoordinates(e.pageX,e.pageY);
			}
			function mouseOut(){
				this.attr({'stroke-width':DEFAULT_SHAPE_STYLE['stroke-width']});
				tooltip
					.hide();
				this.mouseovered = false;
				this.district_set = false;
			}
		},
		removeDragListeners:function(){
			for(var i=this.printed_shapes.length-1;i>=0;i--){
				var district = this.printed_shapes[i];
				district.removeDragListener();
				district.raphael_object.attr('cursor','default');
			}
			return this;
		},
		organizeSolution:function(){
			var self = this;
			orientShapes();
			moveToTop();
			this.state_outline.remove();
			this.par.storeLocations();
			function orientShapes(){
				var printed_shapes = self.printed_shapes;
				var validators = self.printed_shapes[0].validators;
				printed_shapes[0].raphael_object.moveShapeToCoords(self.validation_point);
				var new_coords = fauxGetBbox(printed_shapes[0].raphael_object);
				for(var i = printed_shapes.length-1;i>=1;i--){
					printed_shapes[i].raphael_object.moveShapeToCoords({x: new_coords.x - validators[i].x, y: new_coords.y - validators[i].y});
				}
			}
			function moveToTop(){
				var set = self.canvas.set();
				for(var i = self.printed_shapes.length-1;i>=0;i--){
					set.push(self.printed_shapes[i].raphael_object);
				}
				var bbox = fauxGetBbox(set);
				var dx = Math.round(((920-bbox.width)/2)-bbox.x);
				var dy = Math.round(-1*bbox.y);
				var transform_string = '...T' + dx + ',' + dy;
				set.transform(transform_string);
				self.state_outline.transform(transform_string);
			}
			return this;
		},
		selectDistrict:function(district_code){
			var printed_shapes = this.printed_shapes;
			var check_code = this.state_code + district_code;
			for(var i = printed_shapes.length-1; i>=0; i--){
				if(printed_shapes[i].district_code == check_code){
					return printed_shapes[i];
				}
			}
		}
	};
	function Congressional_District_Shape(parent,state_code,district_code){
		this.state_code=state_code;
		this.district_code=district_code;
		this.par = parent;
		this.printShape(state_code,district_code);
	}
	Congressional_District_Shape.prototype = {
		printShape:function(state_code,district_code){
			var self = this;
			var pathString = CDS[state_code][district_code];
			var fill_color = getColor();
			var scale_string = this.par.scale_string;
			var path = this.par.canvas.path(pathString)
				.attr(DEFAULT_SHAPE_STYLE)
				.attr({'fill':fill_color})
				.transform(scale_string)
				.hover(markerHover,markerHoverOut);
			path.fill_color = fill_color;
			path.par = this;
			path.scale_string = scale_string;
			path.moveShape = Congressional_District_Shape.moveShape; //storing a reference to this function in path for enhanced performance
			path.moveShapeToCoords = Congressional_District_Shape.moveShapeToCoords; //storing a reference to this function in path for enhanced performance
			path.lastx = 0;
			path.lasty = 0;
			path.mouseovered = false;
			this.raphael_object = path;
			function getColor(){
				var fill_color;
				if(!self.par.par.current_state.colors[district_code]){
					fill_color = Raphael.getColor(1);
					self.par.par.current_state.colors[district_code] = fill_color;
				}
				else{
					fill_color = self.par.par.current_state.colors[district_code];
				}
				return fill_color;
			}
			function markerHover(){
				if(hover_district){
					hover_district.attr({'stroke-width':DEFAULT_SHAPE_STYLE['stroke-width']});
					hover_district.mouseovered=false;
				}
				if(!this.mouseovered){
					this.mouseovered = true;
					if(!dragging){
						this
							.attr({'stroke-width':2})
							.toFront();
					}
					hover_district = this;
				}
			}
			function markerHoverOut(){
				this.attr({'stroke-width':DEFAULT_SHAPE_STYLE['stroke-width']});
				this.mouseovered=false;
				hover_district = undefined;
			}
		},
		placeDistrict:function(state_code,districtIndex,isSolved){
			var self = this;
			var shape = this.raphael_object;
			var new_coords = determineCoords();
			shape.moveShapeToCoords(new_coords);
			if(!isSolved){
				this.addDragListener();
			}
			function determineCoords(){
				var new_coords;
				if(self.par.par.current_state.locations[0]){ //use the cached coordinates if they exist
					new_coords = self.par.par.current_state.locations[districtIndex];
				}
				else{
					//if the user hasn't already moved this shape, put it at the coordinates specified in SELECTED_LOCATIONS
					new_coords = {
						x:SELECTED_LOCATIONS[state_code][districtIndex].x,
						y:SELECTED_LOCATIONS[state_code][districtIndex].y
					};
				}
				return new_coords;
			}
		},
		getValidators:function(){
			/*
				This function runs before the districts break apart. It iterates over all the other districts
				of the state, and determines how far each district's top-left corner should be to this
				district's top-left corner for the puzzle is perfectly solved.
			*/
			var shapes = this.par.printed_shapes;
			var bbox = fauxGetBbox(this.raphael_object);
			var thisx = bbox.x;
			var thisy = bbox.y;
			this.validators = {};
			for(var a=shapes.length-1;a>-1;a--){
				var shape_bbox = fauxGetBbox(shapes[a].raphael_object);
				this.validators[a] = {
					x:thisx-shape_bbox.x, //proper distance between left edges of the shapes
					y:thisy-shape_bbox.y //proper distance between the top edges of the shapes
				};
			}
		},
		addDragListener:function(){
			var self = this;
			this.raphael_object
				.attr({'cursor':'move'})
				.drag(move,start,up);
			function start(event){
				var selected_shapes = this.par.par.selected_shapes;
				if(!self.isSelected){
					if(!self.par.par.shifted){
						self.par.unselectShapes();
					}
					self.selectShape();
				}
				selected_shapes = this.par.par.selected_shapes;
				for(var i=selected_shapes.length-1;i>=0;i--){
					delete selected_shapes[i].raphael_object.lastdx;
					delete selected_shapes[i].raphael_object.lastdy;
				}
				this
					.toFront()
					.attr({'stroke-width':DEFAULT_SHAPE_STYLE['stroke-width'],opacity:0.8});
				dragging = true;
			}
			function move(dx,dy){
				var selected_shapes = this.par.par.selected_shapes;
				for(var i=selected_shapes.length-1;i>=0;i--){
					selected_shapes[i].raphael_object.moveShape(dx,dy);
				}
			}
			function up(){
				// Fires on drag release.
				var self = this;
				var selected_shapes = this.par.par.selected_shapes;
				for(var i=selected_shapes.length-1;i>=0;i--){
					setShape(selected_shapes[i].raphael_object);
				}
				this.par.par.par.storeLocations();
				dragging = false;
				this.par.par.checkAnswer();
				function setShape(obj){ //Fires when drag ends
					var objBBox = fauxGetBbox(obj);
					obj.attr({opacity: DEFAULT_SHAPE_STYLE.opacity});
					setPre();
					boundX();
					boundY();
					function boundX(){
						//If the shape is out of bounds X-wise, put it back!
						var objx = Math.round(objBBox.x);
						var objWidth = Math.round(objBBox.width);
						if(objx<0){
							obj.moveShape(objx*-1,0);
							setPre();
						}
						else if(objx>920-objWidth){
							obj.moveShape(-1*(objx-(920-objWidth)),0);
							setPre();
						}
					}
					function boundY(){
						//If the shape is out of bounds Y-wise, put it back!
						var objy = Math.round(objBBox.y);
						var objHeight = Math.round(objBBox.height);
						if(objy<0){
							obj.moveShape(0,objy*-1);
							setPre();
						}
						else if(objy>650-objHeight){
							obj.moveShape(0,-1*(objy-(650-objHeight)));
							setPre();
						}
					}
					function setPre(){
						/* Prepare the shape for future dragging */
						obj.lastx = obj.lastdx?(obj.lastx+obj.lastdx):obj.lastx;
						obj.lasty = obj.lastdy?(obj.lasty+obj.lastdy):obj.lasty;
					}
				}
			}
		},
		removeDragListener:function(){
			this.raphael_object
				.undrag();
		},
		validatePlacements:function(){
			/*	
				Returns true if all the districts in the state are positioned accurately enough
				for the puzzle to be considered solved.
			*/
			var shapes = this.par.printed_shapes;
			for(var i=shapes.length-1;i>-1;i--){
				if(!this.validateVector(i)){
					return false;
				}
			}
			return true;
		},
		validateVector:function(comparison_shape_index){
			/* Checks whether this district is position correctly in relation to a given other */
			var validation_leeway = VALIDATION_LEEWAY; //As stated above, VALIDATION_LEEWAY allows the user a margin of error in placement
			var compare_shape_bbox  = fauxGetBbox(this.par.printed_shapes[comparison_shape_index].raphael_object);
			var this_bbox = fauxGetBbox(this.raphael_object);
			var correct_offsets = this.validators[comparison_shape_index];
			var current_offsets = {
				x:this_bbox.x-compare_shape_bbox.x,
				y:this_bbox.y-compare_shape_bbox.y
			};
			if(current_offsets.x<correct_offsets.x-validation_leeway){
				return false;
			}
			if(current_offsets.x>correct_offsets.x+validation_leeway){
				return false;
			}
			if(current_offsets.y<correct_offsets.y-validation_leeway){
				return false;
			}
			if(current_offsets.y>correct_offsets.y+validation_leeway){
				return false;
			}
			return true;
		},
		selectShape:function(){
			/* Selects the shape. Used in conjunction with shift key to move multiple shapes at once */
			this.raphael_object.attr({'fill':'#faffd6'});
			if(!this.par.selected_shapes){
				this.par.selected_shapes = [];
			}
			this.isSelected = true;
			this.par.selected_shapes.push(this);
		},
		unselectShape:function(){
			this.raphael_object.attr({'fill':this.raphael_object.fill_color});
			this.isSelected = false;
		},
		highlight:function(){
			/* 
				Highlights the shape when the puzzle is solved when the user hovers over it or
				a reference to it in the explainer text (the "blurb")
			*/
			var shapes = this.par.printed_shapes;
			for(var i=shapes.length-1;i>=0;i--){
				shapes[i].raphael_object.attr({opacity:0.4});
			}
			this.raphael_object
				.attr({'stroke-width':2, opacity:DEFAULT_SHAPE_STYLE.opacity})
				.toFront();
			this.par.par.tooltip.showAtDistrict(this);
		},
		unhighlight:function(){
			var shapes = this.par.printed_shapes;
			for(var i=shapes.length-1;i>=0;i--){
				shapes[i].raphael_object.attr({opacity:DEFAULT_SHAPE_STYLE.opacity});
			}
			this.raphael_object.attr({'stroke-width':DEFAULT_SHAPE_STYLE['stroke-width']});
			this.par.par.tooltip.hide();
		}
	};
	Congressional_District_Shape.moveShapeToCoords = function(new_coords){
		/* Moves the shape to the new coordinates */
		var current_coords = fauxGetBbox(this);
		var dx = new_coords.x - current_coords.x;
		var dy = new_coords.y - current_coords.y;
		this.moveShape(dx,dy);
		this.lastx = dx;
		this.lasty = dy;
	};
	Congressional_District_Shape.moveShape = function(dx,dy){
		/* Moves the shape dx pixels to the right and dy pixels lower */
		var xtransform = dx + (this.lastx?this.lastx:0);
		var ytransform = dy + (this.lasty?this.lasty:0);
		var tstring = 'T'+xtransform+','+ytransform+this.scale_string;
		this.transform(tstring);
		this.lastdx = dx;
		this.lastdy = dy;
	};
	function Tooltip(id,parent){
		this.obj = $('#'+id).appendTo('body');
		this.par = parent;
	}
	Tooltip.prototype = {
		showAtCoordinates:function(x,y,no_offset){
			this.obj
				.css({
					'left':x+15,
					'top':y+(no_offset?0:15)
				})
				.show();
			return this;
		},
		setDistrict:function(district_code){
			district_code = district_code.substring(2,district_code.length);
			district_code = parseInt(district_code,10);
			var state_code = this.par.puzzle.state_code;
			var district_data = VOTE_DATA[state_code][district_code];
			var s = '<p style="text-align:center">'+state_code+'-'+district_code+'</p>';
			s += '<p style="font-size:13px;text-align:center">2012 House vote<span style="font-size:9px">*</span></p>';
			s += '<p>Republican: '+district_data.percr+'%</p>';
			s += '<p>Democratic: '+district_data.percd+'%</p>';
			this.obj.html(s);
			return this;
		},
		showAtDistrict:function(cd){
			var bbox = fauxGetBbox(cd.raphael_object);
			var canvas_offset = this.par.puzzle.canvas_jquery.offset();
			var x = bbox.x + bbox.width + canvas_offset.left;
			var y = bbox.y + bbox.height/2 + canvas_offset.top - this.obj.height()/2;
			this
				.setDistrict(cd.district_code)
				.showAtCoordinates(x,y,true);
			return this;
		},
		hide:function(){
			this.obj.hide();
			return this;
		}
	};
	function fauxGetBbox(raphael_obj){
		/* 
			getBBox() is dreadfully slow on FireFox, such that loading the puzzles sometimes takes entire seconds. 
			This function replaces getBbox() with a custom process that runs well on FireFox.
			However, that process relies on a native method, getBoundingClientRect(), whose implementation varies across browsers.
			Specifically, in IE the method does not consider transformations. That breaks everything.
			The variable GBCR_CONSIDERS_TRANSFORM says whether getBoundingClientRect() considers transformations in the client browser.
			If it does, fauxGetBbox will run this custom function.
			If it doesn't, fauxGetBbox will just run classic getBbox().
			
			TL;DR - Enhance's Firefox's performance while maintaining compatability with IE.
		*/
		var bcr_xleast,
			bcr_xmost,
			bcr_yleast,
			bcr_ymost,
			bounding_client,
			out_width,
			out_height,
			out_x1,
			out_y1,
			out_x2,
			out_y2,
			int_canvas_offset = $('#int_raphael_canvas').offset();
		if(!GBCR_CONSIDERS_TRANSFORM){
			return raphael_obj.getBBox();
		}
		else{ //alternative to getBBox starts here
			if(raphael_obj.type==='set'){
				bounding_client = raphael_obj.items[0].node.getBoundingClientRect();
				bcr_xleast = bounding_client;
				bcr_xmost = bounding_client;
				bcr_yleast  = bounding_client;
				bcr_ymost = bounding_client;
				for(var i=raphael_obj.items.length-1;i>-1;i--){
					var dat = raphael_obj.items[i].node.getBoundingClientRect();
					if(dat.left < bcr_xleast.left){
						bcr_xleast = dat;
					}
					if(dat.right > bcr_xmost.right){
						bcr_xmost = dat;
					}
					if(dat.top < bcr_yleast.top){
						bcr_yleast = dat;
					}
					if(dat.bottom > bcr_ymost.bottom){
						bcr_ymost = dat;
					}
				}
			}
			else{
				bounding_client = raphael_obj.node.getBoundingClientRect();
				bcr_xleast = bounding_client;
				bcr_xmost = bounding_client;
				bcr_yleast = bounding_client;
				bcr_ymost = bounding_client;
			}
			if(window.pageXOffset){
				out_x1 = bcr_xleast.left - (int_canvas_offset - $(window).scrollLeft());
				out_x2 = bcr.xmost.right - (int_canvas_offset - $(window).scrollLeft());
			}
			else{
				out_x1 = bcr_xleast.left - int_canvas_offset.left;
				out_x2 = bcr_xmost.right - int_canvas_offset.left;
			}
			if(window.pageYOffset){
				out_y1 = bcr_yleast.top - (int_canvas_offset.top - $(window).scrollTop());
				out_y2 = bcr_ymost.bottom - (int_canvas_offset.top - $(window).scrollTop());
			}
			else{
				out_y1 = bcr_yleast.top - int_canvas_offset.top;
				out_y2 = bcr_ymost.bottom - (int_canvas_offset.top - $(window).scrollTop());
			}
			return {
				x:out_x1,
				y:out_y1,
				x2:out_x2,
				y2:out_y2,
				width:out_x2-out_x1,
				height:out_y2-out_y1
			};
		}
	}
	function gbcrConsidersTransform(canvas_container){
		/* 
			Returns true if getBoundingClientRect() accounts for transformations.
			On some browsers, like Internext Explorer, it does not. See fauxGetBbox() for more.
		*/
		var obj = $('#'+canvas_container);
		var canvas = Raphael(canvas_container,100,100);
		var rect = canvas.rect(0,0,1,1);
		var pre_transform = rect.node.getBoundingClientRect();
		rect.transform('t100,100');
		var post_transform = rect.node.getBoundingClientRect();
		rect.remove();
		if(post_transform.top == pre_transform.top){
			return false;
		}
		else{
			return true;
		}
	}
	function getShareText(score,state,twitter){
		var shareText = '';
		if(state){
			shareText = "I solved "+state.fullName+" in "+score+" playing "+(twitter?'@':'')+"Slate's Gerrymandering Jigsaw Puzzle!";
		}
		else{
			shareText = "I completed "+(twitter?'@':'')+"Slate's Gerrymandering Jigsaw Puzzle in "+score+'!';
		}
		return shareText;
	}
	function twitterShare(score,state){
		var share_text = getShareText(score,state,true);
		var width  = 575,
			height = 400,
			left   = ($(window).width()  - width)  / 2,
			top    = ($(window).height() - height) / 2,
			opts   = 'status=1' +
			',width='  + width  +
			',height=' + height +
			',top='    + top    +
			',left='   + left;
		var URL = 'http://twitter.com/intent/tweet?' + '&text=' + share_text +'&url=' + encodeURI(getURL());
		window.open(URL,'twitter',opts);
	}
	function facebookShare(score,state){
		var thisURL = getURL();
		var share_text = getShareText(score,state,false);
		var obj = {
			method: 'feed',
			link: thisURL,
			picture: FACEBOOK_SHARE_IMG_SRC,
			name: share_text,
			caption: 'Slate.com',
			description: "Can you put the ridiculously gerrymandered congressional districts back together?"
		};
		function callback(response) {
			document.getElementById('msg').innerHTML = "Post ID: " + response.post_id;
		}
		FB.ui(obj, callback);
	}
	function getURL(){
		var url = $(location).attr('href').indexOf('?')>-1?$(location).attr('href').substring(0, $(location).attr('href').indexOf('?')):$(location).attr('href');
		return url;
	}
	var myInteractive = new Interactive();
}); //end jquery