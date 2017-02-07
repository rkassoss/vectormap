
	jQuery(function(){
		var wfMap = {
			connectCount: 0,
			map: false,
			draw: false,
			markerIDX: 0,
			bombs: [],
			explosions: [],
			startSockets: function(){
				this.connectCount++;
				if(this.connectCount > 20){
					return;
				}
				var self = this;
				jQuery('#mapPCTText').data('greater', jQuery('#mapPCTText').html());
				var socket = new WebSocket('wss://noc3.wordfence.com/wfliveattacks/');
				socket.onopen = function(){};
				socket.onmessage = function(evt){
					if(evt.data){
						try {
							var rec = JSON.parse(evt.data);
						} catch(e){ return; }
						
						if (rec.d.p < 1) {
							jQuery('#mapPCT').html(1);
							jQuery('#mapPCTText').html('showing less than');
						}
						else {
							jQuery('#mapPCT').html(rec.d.p);
							jQuery('#mapPCTText').html(jQuery('#mapPCTText').data('greater'));
						}
						
						jQuery('#attacksPerMin').html(rec.d.lm);
						var from = self.map.latLngToPoint(rec.a.lat, rec.a.lon);
						var to = self.map.latLngToPoint(rec.s.lat, rec.s.lon);
						if(rec.a.blockedNow){
							//var blockedImage = self.draw.image('/map/blocked.png',64,64).move(from.x - 32, from.y - 32);
							//blockedImage.animate(5000, '<').attr({ opacity: 0 }).after(function(){ blockedImage.remove(); });
						}
						var fromCircle = self.draw.circle(4).fill('#2d2d2d').move(from.x - 2, from.y - 2);
						var fromText = self.draw.text(rec.a.n).move(from.x, from.y - 5).font({
							family: 'Arial',
							size: '10',
							anchor: 'start',
							leading: '1.5em'
							}).fill({ color: (rec.a.blocked ? '#9e0000' : '#11967a')});
						setTimeout(function(){ fromText.remove(); }, 1700);
						//fromText.animate(1700, '<').attr({ opacity: 0 }).after(function(){ fromText.remove(); });
						var path = self.draw.path("M" + parseInt(from.x) + "," + parseInt(from.y) + " C" + parseInt(from.x) + "," + parseInt(from.y - 50) + " " + parseInt(to.x) + "," + parseInt(to.y - 50) + " " + parseInt(to.x) + "," + parseInt(to.y), true).stroke({ width: 1, opacity: (rec.a.blocked ? 0.1 : 0.3), color: '#888' }).attr({ fill: 'none'});
						var bomb = self.draw.circle(6).fill({
							color: (rec.a.blocked ? '#9e0000' : '#11967a'),
							opacity: (rec.a.blocked ? 0.6 : 1)
							}).move(from.x - 3, from.y - 3);
						var tmpIncBy = path.node.getTotalLength() / 50;
						var newIncBy = (path.node.getTotalLength() / 50);
						if(isNaN(newIncBy)){
							//Firefox fix. For some reason newIncBy is a NaN ocasionally in FF.
							newIncBy = 1;
						}
						self.bombs.push({
							blocked: rec.a.blocked,
							fromCircle: fromCircle,
							bomb: bomb,
							path: path,
							xDest: to.x,
							yDest: to.y,
							dist: 0,
							incBy: newIncBy,
							totalLength: path.node.getTotalLength(),
							lastMovedTime: false
							});


					}
					};
				socket.onclose = function(){ setTimeout(function(){ self.startSockets(); }, 10000); }
				socket.onerror = function(){ }
			},
			drawMap: function(){
				this.map = new jvm.WorldMap({
					container: jQuery('#world-map'),
					zoomMax: 1,
					zoomMin: 1,
					zoomButtons : false
					});
				this.draw = SVG('svg-layer').size(1020, 434);
			},
			startBombs: function(){
				var self = this;
				setInterval(function(){
					self.updateBombs();
					self.removeExplosions();
					}, 50);
			},
			updateBombs: function(){
				var toRemove = [];
				for(var i = 0; i < this.bombs.length; i++){
					if(this.bombs[i].lastMovedTime){
						this.bombs[i].dist += (((new Date()).getTime() - this.bombs[i].lastMovedTime) / 50) * this.bombs[i].incBy;
					} else {
						this.bombs[i].dist += this.bombs[i].incBy;
					}
					this.bombs[i].lastMovedTime = (new Date()).getTime();

					this.bombs[i].dist = this.bombs[i].dist > this.bombs[i].totalLength ? this.bombs[i].totalLength : this.bombs[i].dist;
					var p = this.bombs[i].path.node.getPointAtLength(this.bombs[i].dist);
					if(Math.abs(p.x - this.bombs[i].xDest) < 4 && Math.abs(p.y - this.bombs[i].yDest) < 4){
						this.bombs[i].bomb.remove();
						this.bombs[i].path.remove();
						this.bombs[i].fromCircle.remove();
						toRemove.push(i);
						if(this.bombs[i].blocked){
							var explosion = this.draw.circle(20).fill({
								color: '#9e0000',
								opacity: 0.3
								}).center(this.bombs[i].xDest, this.bombs[i].yDest);
							explosion['ctime'] = new Date().getTime();
							this.explosions.push(explosion);
							//explosion.animate(2000, '-').attr({ opacity: 0 }).after(function(){ explosion.remove(); });
						} else {
							var explosion = this.draw.circle(6).fill({
								color: '#11967a',
								opacity: 1
								}).center(this.bombs[i].xDest, this.bombs[i].yDest);
							explosion['ctime'] = new Date().getTime();
							this.explosions.push(explosion);
							//explosion.animate(1000, '-').attr({ opacity: 0 }).after(function(){ explosion.remove(); });
						}


					} else {
						this.bombs[i].bomb.move(p.x - 3, p.y - 3);
					}
				}
				for(var i = toRemove.length - 1; i >= 0; i--){
					this.bombs.splice(toRemove[i], 1);
				}
			},
			drawKey: function(){
				var x = 15;
				var y = 300;
				this.draw.rect(150,80).move(x,y).fill('#FFF').stroke({ color: '#2d2d2d', width: 2});
				this.draw.text("Legend:").move(x + 5, y + 1).font({ family: 'Arial', size: '14'});
				var font = { family: 'Arial', size: '12' };
				this.draw.circle(4).fill('#2d2d2d').move(x + 5, y + 30);
				this.draw.text("Origin point").font(font).move(x + 15, y + 21);
				this.draw.circle(6).fill({ color: '#11967a' }).move(x + 4, y + 44);
				this.draw.text("Not suspicious yet").font(font).move(x + 15, y + 37);
				this.draw.circle(6).fill({ color: '#9e0000' }).move(x + 4, y + 60);
				this.draw.text("Blocked by Wordfence").font(font).move(x + 15, y + 53);

			},
			removeExplosions: function(){
				if(this.explosions.length > 0){
					for(var i = this.explosions.length - 1; i >= 0; i--){
						if((new Date()).getTime() - this.explosions[i]['ctime'] > 300){
							this.explosions[i].remove();
							this.explosions.splice(i, 1);
						}
					}
				}
			}

		};
		wfMap.drawMap();
		wfMap.startSockets();
		wfMap.startBombs();
		//wfMap.drawKey();
		window['WFM'] = wfMap;

	});
