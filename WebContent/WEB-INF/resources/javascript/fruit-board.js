/*FRUIT SCOREBOARD*/

function fb_safe(v, fallback){
	return (v === undefined || v === null || v === '') ? (fallback === undefined ? '-' : fallback) : v;
}
function fb_arr(v){ return Array.isArray(v) ? v : []; }
function fb_esc(v){ return (v === undefined || v === null) ? '' : (v + ''); }

function fb_findSquadName(dataToProcess, playerId){
	var lists = [
		fb_arr(dataToProcess.setup.homeSquad), fb_arr(dataToProcess.setup.homeOtherSquad), fb_arr(dataToProcess.setup.homeSubstitutes),
		fb_arr(dataToProcess.setup.awaySquad), fb_arr(dataToProcess.setup.awayOtherSquad), fb_arr(dataToProcess.setup.awaySubstitutes)
	];
	var found = null;
	lists.forEach(function(list){
		list.forEach(function(p){ if(p.playerId == playerId){ found = p.ticker_name; } });
	});
	return found;
}

function fb_currentInning(dataToProcess){
	var current = null;
	fb_arr(dataToProcess.match.inning).forEach(function(inn){ if(inn.isCurrentInning == 'YES'){ current = inn; } });
	return current;
}

function fb_inningByNumber(dataToProcess, num){
	var res = null;
	fb_arr(dataToProcess.match.inning).forEach(function(inn){ if(inn.inningNumber == num){ res = inn; } });
	return res;
}

function fb_statVal(inn, key){
	if(!inn || !inn.stats){ return ''; }
	for(var k in inn.stats){ if(k == key){ return inn.stats[k]; } }
	return '';
}

function fb_teamName(dataToProcess, teamId){
	if(teamId == dataToProcess.setup.homeTeamId){ return dataToProcess.setup.homeTeam.teamName4; }
	if(teamId == dataToProcess.setup.awayTeamId){ return dataToProcess.setup.awayTeam.teamName4; }
	return '';
}

/* ball-by-ball chip*/
function fb_ballChip(raw){
	var txt = (raw + '').trim();
	var cls = 'fb-ball';
	if(/^w$/i.test(txt)) cls += ' wicket';
	else if(/^4$/.test(txt) || /^6$/.test(txt)) cls += ' boundary';
	else if(/wd|nb/i.test(txt)) cls += ' extra';
	return '<span class="' + cls + '">' + fb_esc(txt) + '</span>';
}

/* Required Run Rate*/
function fb_generateRunRate(runs, overs, balls, numberOfDecimals, ballsPerOver){
	var run_rate = '';
	var decimals = (numberOfDecimals === 1) ? 1 : 2;
	var total_balls = (overs * ballsPerOver) + balls;

	if(total_balls > 0){
		var run_rate_val = (runs / total_balls) * ballsPerOver;
		run_rate = run_rate_val.toFixed(decimals);
	} else if(total_balls === 0){
		run_rate = (0).toFixed(decimals);
	} else if(balls < 0){
		run_rate = '-';
	}
	return run_rate;
}

/*Target*/
function fb_getTargetData(dataToProcess, inn){
	var ballsPerOver = parseInt(dataToProcess.setup.ballsPerOver, 10) || 6;

	var firstInn = fb_inningByNumber(dataToProcess, 1);
	var target = firstInn ? ((parseInt(fb_safe(firstInn.totalRuns,'0'),10) || 0) + 1) : 0;

	var currentRuns = parseInt(fb_safe(inn.totalRuns,'0'),10) || 0;
	var remaningRuns = target - currentRuns;
	var totalOversLimit = parseInt(dataToProcess.setup.oversPerInnings || dataToProcess.setup.totalOvers, 10) || 20;
	var totalMatchBalls = totalOversLimit * ballsPerOver;

	var oversStatParts = fb_safe(fb_statVal(inn, 'OVER' + inn.inningNumber), '0.0').split('.');
	var oversBowled = parseInt(oversStatParts[0], 10) || 0;
	var ballsBowled  = parseInt(oversStatParts[1], 10) || 0;
	var ballsBowledTotal = (oversBowled * ballsPerOver) + ballsBowled;

	var remaningBall = totalMatchBalls - ballsBowledTotal;

	return {
		remaningRuns: remaningRuns,
		remaningBall: remaningBall,
		ballsPerOver: ballsPerOver
	};
}

/* THIS OVER*/
function fb_thisOverFromEvents(dataToProcess, inn){
	var events = fb_arr(dataToProcess.eventFile && dataToProcess.eventFile.events);
	var inningEvents = events.filter(function(e){ return e.eventInningNumber == inn.inningNumber; });

	var overBalls = [];
	var totalRuns = 0;
	var wickets = 0;

	for(var i = inningEvents.length - 1; i >= 0; i--){
		var e = inningEvents[i];
		if(e.eventType == 'end_over'){ break; }
		if(e.eventType == 'CHANGE_BOWLER' || e.eventType == 'NEW_BATSMAN'){ continue; }
		if(e.doNotIncrementBall == 'YES'){ continue; }

		var label;
		if(e.eventType == 'LOG_WICKET'){
			label = 'W'; wickets++;
		} else if(e.eventType == 'WIDE'){
			label = 'wd' + ((e.eventExtraRuns > 1) ? (e.eventExtraRuns - 1) : '');
		} else if(e.eventType == 'NO_BALL' || e.eventType == 'NOBALL'){
			label = 'nb';
		} else if(e.eventType == 'BYE'){
			label = (e.eventExtraRuns || 0) + 'b';
		} else if(e.eventType == 'LEG_BYE' || e.eventType == 'LEGBYE'){
			label = (e.eventExtraRuns || 0) + 'lb';
		} else if(/^\d+$/.test(e.eventType)){
			label = e.eventType;
		} else {
			continue;
		}

		totalRuns += (e.eventRuns || 0) + (e.eventExtraRuns || 0);
		overBalls.unshift(label);
	}

	var runsText = '';
	if(overBalls.length){
		runsText = totalRuns + ' RUN' + (totalRuns == 1 ? '' : 'S') +
			(wickets ? (' & ' + wickets + ' WICKET' + (wickets == 1 ? '' : 'S')) : '');
	}
	return { balls: overBalls, runsText: runsText };
}

function fb_ballsSinceLastBoundary(oversCsv){
	if(!oversCsv){ return '-'; }
	var balls = oversCsv.split(',').map(function(b){ return (b+'').trim(); });
	var count = 0;
	for(var i = balls.length - 1; i >= 0; i--){
		var b = balls[i];
		if(/wd|nb/i.test(b)){ 
			continue; 
		}
		if(/^4$/.test(b) || /^6$/.test(b)){ 
			break; 
		}
		count++;
	}
	return count;
}

function renderFruitBoard(dataToProcess){

	var $root = $('#fruit_captions_div');
	$root.empty();
	if(!dataToProcess || !dataToProcess.match || !dataToProcess.setup){ return; }

	var inn = fb_currentInning(dataToProcess);
	console.log('inningStats:', inn.inningStats);
	if(!inn){ return; }
	var setup = dataToProcess.setup;

	var firstInning = fb_inningByNumber(dataToProcess, 1);
	var secondInning = fb_inningByNumber(dataToProcess, 2);

	var firstInningsTeamName = firstInning ? fb_teamName(dataToProcess, firstInning.battingTeamId) : '';
	var secondInningsTeamName = secondInning ? fb_teamName(dataToProcess, secondInning.battingTeamId) : '';
	var battingTeamName = fb_teamName(dataToProcess, inn.battingTeamId);
	var bowlingTeamId = (inn.battingTeamId == setup.homeTeamId) ? setup.awayTeamId : setup.homeTeamId;
	var bowlingTeamName = fb_teamName(dataToProcess, bowlingTeamId);
	var oversStat = fb_statVal(inn, 'OVER' + inn.inningNumber);
	if(!oversStat){
		var _ov = fb_safe(inn.totalOvers, '0');
		var _bl = fb_safe(inn.totalBalls, '0');
		oversStat = _ov + '.' + _bl;
	}
	var ppRaw = fb_statVal(inn, 'POWERPLAY');
	var isPowerplay = (ppRaw && ppRaw !== '');

	var oppInning = null;
	fb_arr(dataToProcess.match.inning).forEach(function(x){ if(x.battingTeamId == bowlingTeamId){ oppInning = x; } });

	/*TOSS*/
	function fb_tossWinnerTeamId(){
		var tossTextAny = fb_statVal(fb_inningByNumber(dataToProcess,1), 'TOSS') || fb_statVal(inn,'TOSS');
		if(!tossTextAny){ return inn.battingTeamId; }
		var t = (tossTextAny + '').toUpperCase();
		var homeName = ((setup.homeTeam && (setup.homeTeam.teamName1 || setup.homeTeam.teamName4)) + '').toUpperCase();
		var awayName = ((setup.awayTeam && (setup.awayTeam.teamName1 || setup.awayTeam.teamName4)) + '').toUpperCase();
		if(homeName && t.indexOf(homeName) !== -1){ return setup.homeTeamId; }
		if(awayName && t.indexOf(awayName) !== -1){ return setup.awayTeamId; }
		return inn.battingTeamId;
	}
	var tossWinnerTeamId = fb_tossWinnerTeamId();

	/* ---------- batsmen rows (striker / non-striker) ---------- */
	function batsmanRow(wantStrike, dotsKey){
		var bc = null;
		fb_arr(inn.battingCard).forEach(function(b){
			if(b.status == 'NOT OUT' && b.onStrike == (wantStrike ? 'YES':'NO')){ bc = b; }
		});
		if(bc){
			var dots = fb_statVal(inn, dotsKey).split(',')[0];
			var pShip = '0(0)';
			if(fb_arr(inn.partnerships).length > 0){
				var last = inn.partnerships[inn.partnerships.length-1];
				pShip = (bc.playerId == last.no)
					? fb_safe(last.firstBatterRuns,'0') + '(' + fb_safe(last.firstBatterBalls,'0') + ')'
					: fb_safe(last.secondBatterRuns,'0') + '(' + fb_safe(last.secondBatterBalls,'0') + ')';
			}
			return {
				active:true,
				name: fb_safe(bc.player && bc.player.ticker_name,'-'),
				strike: wantStrike,
				runs: fb_safe(bc.runs,'0'), balls: fb_safe(bc.balls,'0'),
				fs: fb_safe(bc.fours,'0') + '/' + fb_safe(bc.sixes,'0'),
				sr: (bc.strikeRate == 0 || bc.strikeRate == undefined) ? '-' : bc.strikeRate,
				dots: fb_safe(dots,'0'),
				pship: pShip
			};
		}
		return { active:false, name:'-', strike:false, runs:'0', balls:'0', fs:'0/0', sr:'-', dots:'-', pship:'0(0)' };
	}
	var bat1 = batsmanRow(true, 'BATSMAN1DOTS');
	var bat2 = batsmanRow(false, 'BATSMAN2DOTS');

	/* ---------- bowlers (current / previous) ---------- */
	function bowlerRow(kind){
		var boc = null;
		fb_arr(inn.bowlingCard).forEach(function(b){ if(b.status == kind){ boc = b; } });
		if(boc){
			return {
				active:true,
				name: fb_safe(boc.player && boc.player.ticker_name,'-'),
				current: (kind=='CURRENTBOWLER'),
				fig: fb_safe(boc.wickets,'0') + '-' + fb_safe(boc.runs,'0'),
				overs: fb_safe(boc.overs,'0') + '.' + fb_safe(boc.balls,'0'),
				dots: fb_safe(boc.dots,'0'),
				econ: (boc.economyRate == 0 || boc.economyRate == undefined) ? '-' : boc.economyRate
			};
		}
		var key = (kind == 'CURRENTBOWLER') ? 'OTHER_BOWLER' : 'PREVIOUS_BOWLER';
		var raw = fb_statVal(inn, key);
		if(raw){
			var p = raw.split(',');
			if(p[0] !== ''){
				return { active:true, name: fb_safe(p[0],'-'), current:false, fig: fb_safe(p[1]), overs: fb_safe(p[4]), dots: fb_safe(p[2]), econ: (p[3]==0?'-':fb_safe(p[3])) };
			}
		}
		return { active:false, name:'-', current:false, fig:'-', overs:'-', dots:'-', econ:'-' };
	}
	var bowl1 = bowlerRow('CURRENTBOWLER');
	var bowl2 = bowlerRow('LASTBOWLER');

	/* ---------- last wicket ---------- */
	var lastWicketHtml = '';
	if(fb_arr(inn.fallsOfWickets).length > 0){
		var lastFow = inn.fallsOfWickets[inn.fallsOfWickets.length-1];
		var outBc = null;
		fb_arr(inn.battingCard).forEach(function(b){ if(b.playerId == lastFow.fowPlayerID){ outBc = b; } });
		if(outBc){
			lastWicketHtml = fb_safe(outBc.player && outBc.player.ticker_name,'-') + ' &nbsp; ' + fb_safe(outBc.howOutText,'') +
			    ' &nbsp; <b>' + fb_safe(outBc.runs,'0') + '</b> <span class="fb-lw-balls">(' + fb_safe(outBc.balls,'0') + ')</span>';
		}
	}

	/* ---------- partnership / CRR / score ---------- */
	var lastPship = fb_arr(inn.partnerships).length ? inn.partnerships[inn.partnerships.length-1] : null;

	/* ---------- extras ---------- */
	var extrasCells = [
		{ lab:'WD:', val: fb_safe(inn.totalWides,'0') },
		{ lab:'NB:', val: fb_safe(inn.totalNoBalls,'0') },
		{ lab:'B:',  val: fb_safe(inn.totalByes,'0') },
		{ lab:'LB:', val: fb_safe(inn.totalLegByes,'0') }
	];
	if(inn.totalPenalties){ extrasCells.push({ lab:'PEN:', val: fb_safe(inn.totalPenalties,'0') }); }

	/* ---------- this over ---------- */
	var thisOverLabel = 'THIS OVER';
	fb_arr(inn.bowlingCard).forEach(function(b){ if(b.status == 'LASTBOWLER'){ thisOverLabel = 'LAST OVER'; } });
	var runsThisOver = fb_statVal(inn, 'ThisOver');
	console.log('runsThisOver---------------------------------------------------'+runsThisOver);
	/* last ball speed  */
	var lastBallSpeed = fb_statVal(inn, 'SPEED');
	var speedBadgeHtml = lastBallSpeed ? ('<span class="fb-lastball-speed"><i class="fas fa-tachometer-alt"></i>' + fb_esc(lastBallSpeed) + '</span>') : '';
	var ballsRaw = fb_statVal(inn, 'OVER');
	var ballChips = ballsRaw ? ballsRaw.split(',').map(fb_ballChip).join('') : '';
	var lastBoundaryBalls = fb_statVal(inn,'BOUNDARY');

	/* ---------- phase wise score ---------- */

	var contextHtml = '';

	if(inn.inningNumber == 1){

	    contextHtml =
	        '<div class="fb-context">' +
	        '<div class="fb-ph-title">SCORE BY PHASES</div>' +
	        '<table>' +
	        '<tr>' +
	        '<th>OVERS</th>' +
	        '<th>' + fb_esc(firstInningsTeamName) + '</th>' +
	        '</tr>' +

	        '<tr>' +
	        '<td>1-6</td>' +
	        '<td>' + fb_safe(fb_statVal(firstInning,'PHASE1'),'-') + '</td>' +
	        '</tr>' +

	        '<tr>' +
	        '<td>7-15</td>' +
	        '<td>' + fb_safe(fb_statVal(firstInning,'PHASE2'),'-') + '</td>' +
	        '</tr>' +

	        '<tr>' +
	        '<td>16-20</td>' +
	        '<td>' + fb_safe(fb_statVal(firstInning,'PHASE3'),'-') + '</td>' +
	        '</tr>' +

	        '</table>' +
	        '</div>';

	} else {

	    contextHtml =
	        '<div class="fb-context">' +
	        '<div class="fb-ph-title">SCORE BY PHASES</div>' +
	        '<table>' +

	        '<tr>' +
	        '<th>OVERS</th>' +
	        '<th>' + fb_esc(firstInningsTeamName) + '</th>' +
	        '<th>' + fb_esc(secondInningsTeamName) + '</th>' +
	        '</tr>' +

	        '<tr>' +
	        '<td>1-6</td>' +
	        '<td>' + fb_safe(fb_statVal(firstInning,'PHASE1'),'-') + '</td>' +
	        '<td>' + fb_safe(fb_statVal(secondInning,'PHASE1'),'-') + '</td>' +
	        '</tr>' +

	        '<tr>' +
	        '<td>7-15</td>' +
	        '<td>' + fb_safe(fb_statVal(firstInning,'PHASE2'),'-') + '</td>' +
	        '<td>' + fb_safe(fb_statVal(secondInning,'PHASE2'),'-') + '</td>' +
	        '</tr>' +

	        '<tr>' +
	        '<td>16-20</td>' +
	        '<td>' + fb_safe(fb_statVal(firstInning,'PHASE3'),'-') + '</td>' +
	        '<td>' + fb_safe(fb_statVal(secondInning,'PHASE3'),'-') + '</td>' +
	        '</tr>' +

	        '</table>' +
	        '</div>';
	}

	var recentSummary = fb_safe(fb_statVal(inn, 'LAST_30_BALLS'), '');
	var bottomRightHtml = '<div class="fb-bpanel' + (inn.inningNumber == 1 ? ' fb-projected-panel' : '') + '">';

	/* LAST 30 BALLS HEADER */
	if(recentSummary){ 
		bottomRightHtml += '<div class="fb-bpanel-title">' + fb_esc(recentSummary).toUpperCase() + '</div>';
	}

	/* PROJECTED SCORE ROWS */
	if(inn.inningNumber == 1){
	    var psRaw = fb_statVal(inn, 'PS');
	    var projRows = [];
	    if(psRaw){
	        var arr = psRaw.split(',');
	        for(var i = 0;
	            i + 1 < arr.length && projRows.length < 3;
	            i += 2){
	            projRows.push({
	                score: arr[i],
	                rate: arr[i + 1]
	            });
	        }
	    }
		bottomRightHtml += '<div class="fb-projected-heading">PROJECTED SCORE</div>';
	    bottomRightHtml += '<div class="fb-projected-rows">';
	    for(var p = 0; p < 3; p++){
	        if(projRows[p]){
	            bottomRightHtml += '<div class="fb-projected-row">' + '<div class="fb-rate">' + '@' + fb_esc(projRows[p].score) + ' RPO' + '</div>' +
	                    '<div class="fb-projval">' + fb_esc(projRows[p].rate) + '</div>' + '</div>';
	        } else {
	            bottomRightHtml += '<div class="fb-projected-row">' + '<div class="fb-rate">@- RPO</div>' + '<div class="fb-projval">-</div>' + '</div>';
	        }
	    }

	    bottomRightHtml += '</div>';
	   } else {
	    var equation = fb_safe(fb_statVal(inn, 'EQUATION'),''
	    );
		if(equation){

		    var equationText = equation.toUpperCase().trim();

		    /*MATCH RESULT*/
			   /* SUPER OVER TIED */

			   var superOverTieMatch = equationText.match(/^SUPER\s+OVER\s+TIED\s*-\s*(.+)$/i);
			   if(superOverTieMatch){

			       var superOverMessage = superOverTieMatch[1].trim();

			       bottomRightHtml +=
			           '<div class="fb-equation-panel fb-superover-tied-panel">' + '<div class="fb-superover-tied-title">' + 'SUPER OVER TIED' +  '</div>' +
			               '<div class="fb-superover-tied-message">' + fb_esc(superOverMessage) + '</div>' + '</div>';
			   } else {
				
			   /*MATCH TIED*/
			   var tieMatch = equationText.match(/^MATCH\s+TIED\s*-\s*WINNER\s+WILL\s+BE\s+DECIDED\s+BY\s+SUPER\s+OVER$/i);

			   if(tieMatch){
			       bottomRightHtml += '<div class="fb-equation-panel fb-tie-panel">' + '<div class="fb-tie-title">' + 'MATCH TIED' + '</div>' +
													 '<div class="fb-tie-message">' + 'WINNER WILL BE DECIDED' + '</div>' +
			              							 '<div class="fb-tie-box">' + 'BY SUPER OVER' + '</div>' + '</div>';
				 } else {
				    var resultMatch = equationText.match( /^(.+?)\s+WIN\s+BY\s+(\d+)\s+(RUNS?|WICKETS?)$/i);

		    if(resultMatch){

		        var resultTeam = resultMatch[1].trim();
		        var resultNumber = resultMatch[2].trim();
		        var resultType = resultMatch[3].trim();

		        bottomRightHtml += '<div class="fb-equation-panel fb-result-panel">' + '<div class="fb-result-team">' + fb_esc(resultTeam) + '</div>' +
											 '<div class="fb-result-winby">' + 'WIN BY' + '</div>' +  '<div class="fb-result-box">' + '<span class="fb-result-number">' + fb_esc(resultNumber) + '</span>' +
		                   					 '<span class="fb-result-type">' + fb_esc(resultType) + '</span>' + '</div>' + '</div>';
				 } else {

		        /* ======================================================
		           NORMAL CHASE EQUATION
		           ====================================================== */

				   var equationMatch = equationText.match( /^(.+?)\s+NEED\s+(\d+)\s+RUNS?\s+TO\s+WIN\s+FROM\s+(\d+)\s+BALLS?(?:\s*(\(DLS\)))?$/i);
		        if(equationMatch){

		            var equationTeam = equationMatch[1].trim();
		            var equationRuns = equationMatch[2].trim();
		            var equationBalls = equationMatch[3].trim();
					var runsText = equationRuns === '1' ? 'RUN' : 'RUNS';
					var ballsText = equationBalls === '1' ? 'BALL' : 'BALLS';
		            var equationDls = equationMatch[4] ? equationMatch[4].trim() : '';

		            bottomRightHtml += '<div class="fb-equation-panel">' + '<div class="fb-equation-team">' + fb_esc(equationTeam) + '</div>' + '<div class="fb-equation-runs">' +
							'<span class="fb-equation-small">NEED</span>' +'<span class="fb-equation-number">' + fb_esc(equationRuns) +'</span>' +
							'<span class="fb-equation-small">' + runsText +'</span>'+ '</div>' + '<div class="fb-equation-balls">' +
		                    '<span class="fb-equation-small">FROM</span>' + '<span class="fb-equation-number">' + fb_esc(equationBalls) + '</span>' +
							'<span class="fb-equation-small">' + ballsText + (equationDls ? ' ' + fb_esc(equationDls) : '') +'</span>' + '</div>' +
		                '</div>';

		        } else {
		            bottomRightHtml += '<div class="fb-equation-panel">' +  '<div class="fb-equation-fallback">' + fb_esc(equationText) + '</div>' + '</div>';
		        	}
				}
		    }
		}
		} else {
		    bottomRightHtml += '<div class="fb-equation-panel">' +  '<div class="fb-equation-fallback">-</div>' + '</div>';
		}
	}
	bottomRightHtml += '</div>';

	/* ---------- stage stats (fours/sixes/at this stage/dots/reviews) ---------- */
	var firstInningsScoreLabel = firstInning ? firstInningsTeamName + ' (' + fb_safe(firstInning.totalRuns,'0') + '-' + fb_safe(firstInning.totalWickets,'0') + ')' : '';

	var secondInningsScoreLabel = secondInning ? secondInningsTeamName + ' (' + fb_safe(secondInning.totalRuns,'0') + '-' + fb_safe(secondInning.totalWickets,'0') + ')' : '';

	/* ---------- squad panel: full batting scorecard + full bowling scorecard ---------- */
	var battingSquad = (inn.battingTeamId == setup.homeTeamId) ? fb_arr(setup.homeSquad).slice() : fb_arr(setup.awaySquad).slice();
	var bowlingSquad = (inn.battingTeamId == setup.homeTeamId) ? fb_arr(setup.awaySquad).slice() : fb_arr(setup.homeSquad).slice();
	var battingSubstitutes = (inn.battingTeamId == setup.homeTeamId) ? fb_arr(setup.homeSubstitutes) : fb_arr(setup.awaySubstitutes);
	var bowlingSubstitutes = (inn.battingTeamId == setup.homeTeamId) ? fb_arr(setup.awaySubstitutes) : fb_arr(setup.homeSubstitutes);
			
		battingSubstitutes.forEach(function(p){
		    if (!p || p.playerId === undefined || p.playerId === null) {
		        return;
		    }
		    var impactStatus = '';
		    if (inn.stats && inn.stats['IMPACT_STATUS_' + p.playerId]) {
		        impactStatus = inn.stats['IMPACT_STATUS_' + p.playerId];
		    }
		    if (impactStatus == 'IMP_IN') {
		        var alreadyExists = false;
		        battingSquad.forEach(function(existingPlayer){
		            if (existingPlayer && existingPlayer.playerId == p.playerId) {
		                alreadyExists = true;
		            }
		        });
		        if (!alreadyExists) {
		            battingSquad.push(p);
		        }
		    }
		});
			/*Impact-IN*/
			bowlingSubstitutes.forEach(function(p){
			    if (!p || p.playerId === undefined || p.playerId === null) {
			        return;
			    }
			    var impactStatus = '';
			    if (inn.stats && inn.stats['IMPACT_STATUS_' + p.playerId]) {
			        impactStatus = inn.stats['IMPACT_STATUS_' + p.playerId];
			    }
			    if (impactStatus == 'IMP_IN') {
			        var alreadyExists = false;
			        bowlingSquad.forEach(function(existingPlayer){
			            if (existingPlayer && existingPlayer.playerId == p.playerId) {
			                alreadyExists = true;
			            }
			        });
			        if (!alreadyExists) {
			            bowlingSquad.push(p);
			        }
			    }
			});
	var battingCardHtml = '';
	fb_arr(battingSquad).forEach(function(p){
		var bc = null;
		fb_arr(inn.battingCard).forEach(function(b){ if(b.playerId == p.playerId){ bc = b; } });
		if(!bc){
		    var noCardImpactStatus = '';
		    if (inn.stats && inn.stats['IMPACT_STATUS_' + p.playerId]) {
		        noCardImpactStatus = inn.stats['IMPACT_STATUS_' + p.playerId];
		    }
		    var noCardImpactTag = '';
		    if (noCardImpactStatus == 'IMP_IN') {
		        noCardImpactTag = '<span class="fb-impact-tag fb-impact-in">IMP</span>';
		    } else if (noCardImpactStatus == 'IMP_OUT') {
		        noCardImpactTag = '<span class="fb-impact-tag fb-impact-out">SUB</span>';
		    }
		    battingCardHtml += '<div class="fb-side-player">' + '<span class="fb-p-block">' + '<span class="fb-p-name">' + fb_esc(p.ticker_name) + ' ' + noCardImpactTag +  ' ' +
		                    '<span class="fb-p-dismiss"></span>' + '</span>' + '</span>' + '<span class="fb-runs-balls"></span>' +  '</div>';
		    return;
		}
		var uiStatus = '';
		if (inn.stats && inn.stats['BATSMAN_UI_STATUS_' + bc.playerId]) {
		    uiStatus = inn.stats['BATSMAN_UI_STATUS_' + bc.playerId];
		}

		var isOut = (bc.status == 'OUT');
		var isOnStrike = bc.status == 'NOT OUT' && bc.onStrike == 'YES';
		var isNonStrike = bc.status == 'NOT OUT' && bc.onStrike == 'NO';
		var isRetiredHurt = (uiStatus == 'RETIRED HURT');
		var isConcussed = (uiStatus == 'CONCUSSED');

		var dismissalLine = isOut ? '<span class="fb-p-dismiss">' + fb_esc(uiStatus || bc.howOutText || 'OUT') + '</span>' : '';
		var statusLine = '';
		if (isOut) {
		    statusLine = dismissalLine;
		} else if (isRetiredHurt) {
		    statusLine = '<span class="fb-p-dismiss">RETIRED HURT</span>';
		} else if (isConcussed) {
		    statusLine = '<span class="fb-p-dismiss">CONCUSSED</span>';
		} else if (isOnStrike || isNonStrike) {
		    statusLine = '<span class="fb-p-dismiss">NOT OUT</span>';
		} else {
		    statusLine = '<span class="fb-p-dismiss"></span>';
		}
		
		var impactStatus = '';
		if (inn.stats && inn.stats['IMPACT_STATUS_' + bc.playerId]) {
		    impactStatus = inn.stats['IMPACT_STATUS_' + bc.playerId];
		}
		var isImpactIn = impactStatus == 'IMP_IN';
		var isImpactOut = impactStatus == 'IMP_OUT';
		
		var impactTag = '';
		if (isImpactIn) {
		    impactTag = '<span class="fb-impact-tag fb-impact-in">IMP</span>';
		} else if (isImpactOut) {
		    impactTag = '<span class="fb-impact-tag fb-impact-out">SUB</span>';
		}
		
		var rb = '';

		if (isOut || isOnStrike || isNonStrike || isRetiredHurt || isConcussed) {
		    rb = fb_safe(bc.runs, '0') + '&nbsp;&nbsp;(' + fb_safe(bc.balls, '0') + ')';
		}

		battingCardHtml += '<div class="fb-side-player' + ((isOnStrike || isNonStrike) ? ' fb-current' : '') + (isOut ? ' fb-out-row' : '') 
				+ '">' + '<span class="fb-p-block">' + 		'<span class="fb-p-name">' + fb_esc(p.ticker_name) + ' ' + impactTag + '  ' +
				statusLine + '</span>' + '</span>' + '<span class="fb-runs-balls">' +rb +  '</span>' + '</div>';
	});

	var bowlingCardHtml = '';
	fb_arr(bowlingSquad).forEach(function(p){
	    var boc = null;
	    fb_arr(inn.bowlingCard).forEach(function(b){
	        if (b.playerId == p.playerId) {
	            boc = b;
	        }
	    });

	    /* Get Impact Player status*/
	    var impactStatus = '';
	    if (inn.stats && inn.stats['IMPACT_STATUS_' + p.playerId]) {
	        impactStatus = inn.stats['IMPACT_STATUS_' + p.playerId];
	    }
	    var isImpactIn = (impactStatus == 'IMP_IN');
	    var isImpactOut = (impactStatus == 'IMP_OUT');
	    var impactTag = '';
	    if (isImpactIn) {
	        impactTag = '<span class="fb-impact-tag fb-impact-in">IMP</span>';
	    } else if (isImpactOut) {
	        impactTag = '<span class="fb-impact-tag fb-impact-out">SUB</span>';
	    }

	    if (!boc) {
	       if (isImpactIn || isImpactOut) {
	            bowlingCardHtml +=  '<div class="fb-side-sub">' + '<span class="fb-bowl-name">' + fb_esc(p.ticker_name) + ' ' + impactTag + '</span>' +
	                   							 '<span class="fb-bowl-fig">-</span>' + '<span class="fb-bowl-ovr">-</span>' +  '<span class="fb-bowl-dots">-</span>' +
	                    						'<span class="fb-bowl-econ">-</span>' + '</div>';
	        }
	        return;
	    }
	    var isCurrent = (boc.status == 'CURRENTBOWLER');
	    bowlingCardHtml += '<div class="fb-side-sub' + (isCurrent ? ' fb-current-bowler' : '') +  '">' + '<span class="fb-bowl-name">' + fb_esc(p.ticker_name) + ' ' + impactTag + '</span>' +
	            						'<span class="fb-bowl-fig">' + fb_safe(boc.wickets,'0') + '-' + fb_safe(boc.runs,'0') + '</span>' +
							            '<span class="fb-bowl-ovr">' + fb_safe(boc.overs,'0') + '.' + fb_safe(boc.balls,'0') + '</span>' +
							            '<span class="fb-bowl-dots">' + fb_safe(boc.dots,'0') + '</span>' +
							            '<span class="fb-bowl-econ">' + (boc.economyRate == 0 || boc.economyRate == undefined ? '-' : boc.economyRate) +'</span>' +
	        '</div>';
	});

	/* ---------- fall of wickets ---------- */
	var fowCells = '';
	for(var w=1; w<=10; w++){
		if(inn.fallsOfWickets && inn.fallsOfWickets[w-1]){
			fowCells += '<div class="fb-fow-cell">' + fb_safe(inn.fallsOfWickets[w-1].fowRuns,'-') + '</div>';
		} else {
			fowCells += '<div class="fb-fow-cell">-</div>';
		}
	}

	/* ASSEMBLE*/
	var html = '';
	html += '<div id="fruit_board">';

	html += '<div class="fb-header">';
	html += '  <div class="fb-logo" style="display:flex;align-items:center;gap:10px;"><img class="fb-logo-image" style="height:46px;width:auto;max-width:54px;object-fit:contain;display:block;" src="resources/Images/doad_logo_header.png" alt="Design on a Dime"> Design on a Dime</div>';
	html += '  <div class="fb-title">';
	html += '    <div class="fb-tourney">' + fb_esc(setup.tournament).toUpperCase() + '</div>';
	html += '    <div class="fb-match">' + fb_esc(setup.matchIdent).toUpperCase() + ' : ' + fb_esc(setup.homeTeam && setup.homeTeam.teamName4).toUpperCase() 
	+ ' vs ' + fb_esc(setup.awayTeam && setup.awayTeam.teamName4).toUpperCase() + '</div>';
	html += '  </div>';
	html += '</div>';

	html += '<div class="fb-grid">';

	/* --- batting table (shared header, 2 rows) --- */
	html += '<div class="fb-battable"><table>' +
		'<tr class="fb-tbl-head"><td></td><td>4s/6s</td><td>S/R</td><td>DOTS</td><td>P\'SHIP</td></tr>' +
		'<tr class="' + (bat1.active?'':'fb-row-empty') + '"><td class="fb-tbl-name">' + bat1.name + ' <b class="fb-tbl-runs">' + bat1.runs + '</b><small>' + bat1.balls + '</small>' 
		+ (bat1.strike?' <i class="fas fa-arrow-left"></i>':'') + '</td><td>' + bat1.fs + '</td><td>' + bat1.sr + '</td><td>' + bat1.dots + '</td><td>' + bat1.pship + '</td></tr>' +
		'<tr class="' + (bat2.active?'':'fb-row-empty') + '"><td class="fb-tbl-name">' + bat2.name + ' <b class="fb-tbl-runs">' + bat2.runs + '</b><small>' + bat2.balls + '</small>' 
		+ (bat2.strike?' <i class="fas fa-arrow-left"></i>':'') + '</td><td>' + bat2.fs + '</td><td>' + bat2.sr + '</td><td>' + bat2.dots + '</td><td>' + bat2.pship + '</td></tr>' +
		'</table></div>';

	/* --- CRR / P'SHIP stacked column --- */
	if(inn.inningNumber == 2){
		var targetData = fb_getTargetData(dataToProcess, inn);
		var rrr = (targetData.remaningRuns <= 0)
			? '-'
			: fb_generateRunRate(targetData.remaningRuns, 0, targetData.remaningBall, 2, targetData.ballsPerOver);

		html += '<div class="fb-crr fb-crr-split">' +
			'<div class="fb-crr-half"><span class="fb-crr-lab">CRR: </span><span class="fb-crr-val">' + fb_safe(inn.runRate,'-') + '</span></div>' +
			'<div class="fb-crr-half"><span class="fb-crr-lab">RRR: </span><span class="fb-crr-val">' + rrr + '</span></div>' +
			'</div>';
	} else {
		html += '<div class="fb-crr">CRR&nbsp;:&nbsp;' + fb_safe(inn.runRate,'-') + '</div>';
	}
	/* --- P'SHIP column --- */
	html += '<div class="fb-pship"><span class="fb-label">P\'SHIP: </span><span class="fb-val">' + (lastPship?fb_safe(lastPship.totalRuns,'0'):'-') + '</span><span class="fb-val-sub">' + (lastPship?fb_safe(lastPship.totalBalls,'0'):'0') + '</span></div>';

	/* --- score box (spans both rows) --- */
	html += '<div class="fb-score">' + (isPowerplay?'<span class="fb-pp-badge">POWERPLAY</span>':'') +
		'<span class="fb-team">' + fb_esc(battingTeamName).toUpperCase() + '</span>' +
		'<span class="fb-runs">' + fb_safe(inn.totalRuns,'0') + ((inn.totalWickets>=10)?'':('-'+fb_safe(inn.totalWickets,'0'))) + '</span>' +
		'<span class="fb-overs"><span class="fb-overs-lab">OVERS -</span> <span class="fb-overs-val">' + fb_safe(oversStat,'0') + '</span></span></div>';

		/* --- last wicket + target + since last boundary --- */

		var targetForInfoBar = 0;
		if(inn.inningNumber == 2){
		    var firstInnForTarget = fb_inningByNumber(dataToProcess, 1);
		    if(firstInnForTarget){
		        targetForInfoBar = (parseInt(fb_safe(firstInnForTarget.totalRuns,'0'),10) || 0) + 1;
		    }
		}
		html += '<div class="fb-infobar">' +'<span class="fb-lw">' + (lastWicketHtml ? ('<span class="fb-info-lab">LAST WICKET:</span> ' + lastWicketHtml) : '') + '</span>' +
		    '<span class="fb-info-right">' +(inn.inningNumber == 2 ? '<span class="fb-target-info">' + '<span class="fb-info-lab">TARGET:</span> ' + '<b>' + targetForInfoBar + '</b>' + '</span>' : '') +
			 '<span class="fb-sb">' + '<span class="fb-info-lab">SINCE LAST B\'DRY:</span> ' + fb_safe(lastBoundaryBalls,'0') + ' BALLS' + '</span>' + '</span>' + '</div>';

		/* --- bowling table (shared header, 2 rows) --- */
		html += '<div class="fb-bowltable"><table>' +  '<tr class="fb-tbl-head"><td></td><td>O</td><td>D</td><td>E</td></tr>' + 
		 '<tr class="' + (bowl1.active ? '' : 'fb-row-empty') + '">' + '<td class="fb-tbl-name">' + bowl1.name + ' <b class="fb-tbl-runs">' + bowl1.fig + '</b>' + (bowl1.current ? ' <i class="fas fa-circle fb-current-bowler"></i>' : '') +
		        '</td>' + '<td>' + bowl1.overs + '</td>' + '<td>' + bowl1.dots + '</td>' + '<td>' + bowl1.econ + '</td>' + '</tr>' +
 		 '<tr class="' + (bowl2.active ? '' : 'fb-row-empty') + '">' + '<td class="fb-tbl-name">' + bowl2.name + ' <b class="fb-tbl-runs">' + bowl2.fig + '</b>' + (bowl2.current ? ' <i class="fas fa-circle fb-current-bowler"></i>' : '') +
		        '</td>' + '<td>' + bowl2.overs + '</td>' + '<td>' + bowl2.dots + '</td>' + '<td>' + bowl2.econ + '</td>' + '</tr>' + 
		    '</table></div>';

	/* --- extras box */
	var extrasHtml = '<div class="fb-speed fb-extras">' +
		'<div class="fb-extras-top"><span class="fb-extras-top-lab">SPEED: </span><span class="fb-extras-top-val">' + fb_safe(lastBallSpeed,'-') + ' kph</span></div>' +
		'<div class="fb-extras-bottom"><span class="fb-extras-total">EXTRAS: <span class="fb-extras-total-val">' + fb_safe(inn.totalExtras,'0') + '</span></span><span class="fb-extras-cells">';
	extrasCells.forEach(function(c){ extrasHtml += '<span class="fb-ex-cell"><span class="fb-ex-lab">' + c.lab + '</span> <span class="fb-ex-val">' + c.val + '</span></span>'; });
	extrasHtml += '</span></div></div>';
	html += extrasHtml;

	/* --- contextual box: phases / target / toss --- */
	html += contextHtml;

	/* --- extras row (old location, now empty) --- */

	/* --- this over --- */
	html += '<div class="fb-thisover"><span class="fb-to-label">' + thisOverLabel + '</span><span class="fb-to-runs">' + fb_esc(runsThisOver).toUpperCase() 
		+ '</span><span class="fb-balls">' + ballChips + '</span></div>';
	/* --- stage stats table --- */
	var firstInningsStats = firstInning;
	var secondInningsStats = secondInning;

	var firstTeamFours = firstInningsStats ? fb_statVal(firstInningsStats, 'TEAM_FOURS') : '';
	var secondTeamFours = secondInningsStats ? fb_statVal(secondInningsStats, 'TEAM_FOURS') : '';
	var firstTeamSixes = firstInningsStats ? fb_statVal(firstInningsStats, 'TEAM_SIXES') : '';
	var secondTeamSixes = secondInningsStats ? fb_statVal(secondInningsStats, 'TEAM_SIXES') : '';
	var firstTeamDots = firstInningsStats ? fb_statVal(firstInningsStats, 'TEAM_DOTS') : '';
	var secondTeamDots = secondInningsStats ? fb_statVal(secondInningsStats, 'TEAM_DOTS') : '';
	var firstTeamReviews = firstInningsStats ? fb_statVal(firstInningsStats, 'REVIEWS') : '';
	var secondTeamReviews = secondInningsStats ? fb_statVal(secondInningsStats, 'REVIEWS') : '';
	var firstAtStage = firstInningsStats ? fb_statVal(firstInningsStats, 'TEAM_ATSTAGE') : '-';

	var secondAtStage = '-';
	if(inn.inningNumber == 2 && secondInningsStats){
	    var opponentAtStage = fb_statVal(secondInningsStats, 'OPP_ATSTAGE');
	    if(opponentAtStage !== undefined && opponentAtStage !== null && opponentAtStage !== ''){
	        firstAtStage = opponentAtStage;
	    }
	    secondAtStage = fb_statVal(secondInningsStats, 'TEAM_ATSTAGE');
	}

	   html += '<div class="fb-stage"><table>' +
	       '<tr>' +'<th>' + fb_esc(firstInningsScoreLabel) + '</th>' +'<th></th>' +'<th>' + fb_esc(secondInningsScoreLabel) + '</th>' + '</tr>' +
	       '<tr>' +'<td>' + fb_safe(firstTeamFours, '0') + '</td>' +'<td class="fb-mid-label">FOURS</td>' +'<td>' + fb_safe(secondTeamFours, '0') + '</td>' + '</tr>' +
	       '<tr>' +'<td>' + fb_safe(firstTeamSixes, '0') + '</td>' +'<td class="fb-mid-label">SIXES</td>' + '<td>' + fb_safe(secondTeamSixes, '0') + '</td>' + '</tr>' +
	       '<tr>' +'<td>' + fb_safe(firstAtStage, '-') + '</td>' +'<td class="fb-mid-label">AT THIS STAGE</td>' + '<td>' + fb_safe(secondAtStage, '-') + '</td>' +'</tr>' +
	       '<tr>' +'<td>' + fb_safe(firstTeamDots, '0') + '</td>' +'<td class="fb-mid-label">DOTS</td>' +'<td>' + fb_safe(secondTeamDots, '0') + '</td>' + '</tr>' +
	       '<tr>' +'<td>' + fb_safe(firstTeamReviews, '0') + '</td>' +'<td class="fb-mid-label">REVIEWS</td>' + '<td>' + fb_safe(secondTeamReviews, '0') + '</td>' + '</tr>' +
	       '</table></div>';

	/* --- bottom-right contextual panel --- */
	html += bottomRightHtml;

	/* --- fall of wickets --- */
	html += '<div class="fb-fow"><div class="fb-fow-header-row"><div class="fb-fow-title">FOW</div><div class="fb-fow-nums">' +
		[1,2,3,4,5,6,7,8,9,10].map(function(n){ return '<div class="fb-fow-cell">' + n + '</div>'; }).join('') +
		'</div></div>' +
		'<div class="fb-fow-row"><div class="fb-fow-team-label">' + fb_esc(battingTeamName).toUpperCase() + '</div><div class="fb-fow-nums">' + fowCells + '</div></div>' +
		'</div>';

	/* --- right side panel: full batting scorecard + full bowling scorecard --- */
	/* TOSS*/
	var battingIsTossWinner = (inn.battingTeamId == tossWinnerTeamId);
	var bowlingIsTossWinner = (bowlingTeamId == tossWinnerTeamId);
	html += '<div class="fb-side-panel">';
	html += '  <div class="fb-side-bar"><span>' + fb_esc(battingTeamName).toUpperCase() + '</span>' + (battingIsTossWinner ? '<span class="fb-toss-tag">TOSS</span>' : '') + '</div>';
	html += '  <div class="fb-side-list">' + battingCardHtml + '</div>';
	html += '  <div class="fb-side-bar fb-side-bar-2"><span>' + fb_esc(bowlingTeamName).toUpperCase() + '</span>' + (bowlingIsTossWinner ? '<span class="fb-toss-tag">TOSS</span>' : '') + '</div>';
	html += '  <div class="fb-side-sub-head">' + '<span></span>' + '<span>FIG</span>' + '<span>OVR</span>' + '<span>DOTS</span>' + '<span>ECON</span>' +'</div>';
	html += '  <div class="fb-side-list fb-side-list-bowl">' + (bowlingCardHtml || '<div class="fb-side-empty">No overs bowled yet</div>') + '</div>';
	html += '</div>';
	html += '</div>'; /* /.fb-grid */
	html += '</div>'; /* /#fruit_board */

	$root.html(html);
	document.getElementById('fruit_captions_div').style.display = '';
	fb_fitToViewport();
}

function fb_fitToViewport(){
	var board = document.getElementById('fruit_board');
	if(!board){ return; }
	fb_applyFit(board);
	
	requestAnimationFrame(function(){
		requestAnimationFrame(function(){
			fb_applyFit(document.getElementById('fruit_board'));
		});
	});
}

function fb_applyFit(board){
	if(!board || !board.isConnected){ return; }

	board.style.transform = 'none';
	var naturalW = board.offsetWidth || 1920;
	var naturalH = board.offsetHeight || 1;

	board.style.position = 'fixed';
	board.style.top = '0';
	board.style.left = '0';
	board.style.margin = '0';

	var scaleX = window.innerWidth / naturalW;
	var scaleY = window.innerHeight / naturalH;
	if(!isFinite(scaleX) || scaleX <= 0){ scaleX = 1; }
	if(!isFinite(scaleY) || scaleY <= 0){ scaleY = 1; }

	board.style.transformOrigin = 'top left';
	board.style.transform = 'scale(' + scaleX + ',' + scaleY + ')';
}

var fb_resizeTimer = null;
window.addEventListener('resize', function(){
	clearTimeout(fb_resizeTimer);
	fb_resizeTimer = setTimeout(fb_fitToViewport, 120);
});

if(window.document && document.fonts && document.fonts.ready){
	document.fonts.ready.then(function(){ fb_fitToViewport(); });
}