function processWaitingButtonSpinner(whatToProcess) 
{
	switch (whatToProcess) {
	case 'START_WAIT_TIMER': 
		$('.spinner-border').show();
		$(':button').prop('disabled', true);
		break;
	case 'END_WAIT_TIMER': 
		$('.spinner-border').hide();
		$(':button').prop('disabled', false);
		break;
	}
	
}
function processUserSelectionData(whatToProcess,dataToProcess){
	switch (whatToProcess) {
	case 'LOGGER_FORM_KEYPRESS':
		switch (dataToProcess) {
			case 84: // Teams
				if($('#select_page').val() == 'teams'){
					document.teams_form.method = 'post';
					document.teams_form.action = 'change_to_teams';
		   			document.teams_form.submit();
				}else if($('#select_page').val() == 'ident'){
					document.ident_form.method = 'post';
					document.ident_form.action = 'change_to_teams';
		   			document.ident_form.submit();
				}else if($('#select_page').val() == 'fruit'){
					document.fruit_form.method = 'post';
					document.fruit_form.action = 'change_to_teams';
		   			document.fruit_form.submit();
				}
				break;
			case 73: // Ident
				if($('#select_page').val() == 'teams'){
					document.teams_form.method = 'post';
					document.teams_form.action = 'change_to_ident';
		   			document.teams_form.submit();
				}else if($('#select_page').val() == 'ident'){
					document.ident_form.method = 'post';
					document.ident_form.action = 'change_to_ident';
		   			document.ident_form.submit();
				}else if($('#select_page').val() == 'fruit'){
					document.fruit_form.method = 'post';
					document.fruit_form.action = 'change_to_ident';
		   			document.fruit_form.submit();
				}
				break;
			case 70: // Fruit
				if($('#select_page').val() == 'teams'){
					document.teams_form.method = 'post';
					document.teams_form.action = 'change_to_fruit';
		   			document.teams_form.submit();
				}else if($('#select_page').val() == 'ident'){
					document.ident_form.method = 'post';
					document.ident_form.action = 'change_to_fruit';
		   			document.ident_form.submit();
				}else if($('#select_page').val() == 'fruit'){
					document.fruit_form.method = 'post';
					document.fruit_form.action = 'change_to_fruit';
		   			document.fruit_form.submit();
				}
				break;		
		}
		break;
	}
}
function processCricketProcedures(whatToProcess)
{
	var valueToProcess;
	
	switch(whatToProcess) {
	case 'READ-MATCH-AND-POPULATE':
		valueToProcess = $('#matchFileTimeStamp').val();
		break;
	}

	$.ajax({
        type : 'Get',
        url : 'processCricketProcedures.html',
        data : 'whatToProcess=' + whatToProcess + '&valueToProcess=' + valueToProcess,
        dataType : 'json',
        success : function(data) {
        	switch(whatToProcess) {
			case 'READ-MATCH-AND-POPULATE':
				if(data){
					addItemsToList(whatToProcess,data);
					document.getElementById('matchFileTimeStamp').value = data.setup.matchFileTimeStamp;
				} else if($('#select_page').length && $('#select_page').val() == 'fruit'){
					/* server responded but with no data - surface it instead of a blank screen */
					$('#fruit_captions_div').html(
						'<div style="color:#F7D774;background:#0A1747;padding:24px;font-family:Segoe UI,Arial,sans-serif;font-size:16px;border:2px solid #F2C230;">' +
						'Server returned no match data for this request.' +
						'</div>'
					);
					document.getElementById('fruit_captions_div').style.display = '';
				}
				break;
        	}
	    },
	    error : function(e) {
	  	 	console.log('Error occured in ' + whatToProcess + ' with error description = ' + e);
	  	 	if(whatToProcess == 'READ-MATCH-AND-POPULATE' && $('#select_page').length && $('#select_page').val() == 'fruit'){
	  	 		/* AJAX call itself failed (network/session/500) - surface it instead of a blank screen */
	  	 		$('#fruit_captions_div').html(
	  	 			'<div style="color:#F7D774;background:#0A1747;padding:24px;font-family:Segoe UI,Arial,sans-serif;font-size:16px;border:2px solid #F2C230;">' +
	  	 			'Could not reach the server (processCricketProcedures.html).<br>Check DevTools (F12) &rarr; Network tab for the failed request\'s status code.' +
	  	 			'</div>'
	  	 		);
	  	 		document.getElementById('fruit_captions_div').style.display = '';
	  	 	}
	    }
	});
}

function addItemsToList(whatToProcess, dataToProcess)
{
	switch (whatToProcess) {

	case 'READ-MATCH-AND-POPULATE':

		/*
		 * ---------------------------------------------------------
		 * FRUIT PAGE
		 * ---------------------------------------------------------
		 */
		if($('#select_page').length && $('#select_page').val() == 'fruit'){

			if(typeof renderFruitBoard === 'function'){

				try{
					renderFruitBoard(dataToProcess);

				}catch(fbErr){

					console.error('renderFruitBoard threw an error:', fbErr);

					$('#fruit_captions_div').html(
						'<div style="color:#F7D774;background:#0A1747;padding:24px;' +
						'font-family:Segoe UI,Arial,sans-serif;font-size:16px;' +
						'border:2px solid #F2C230;">' +
						'Fruit board failed to render.<br>' +
						'Open browser DevTools (F12) &rarr; Console tab and send me the red error text.' +
						'</div>'
					);

					document.getElementById('fruit_captions_div').style.display = '';
				}

			}else{

				console.error(
					'renderFruitBoard is undefined - fruit-board.js did not load.'
				);

				$('#fruit_captions_div').html(
					'<div style="color:#F7D774;background:#0A1747;padding:24px;' +
					'font-family:Segoe UI,Arial,sans-serif;font-size:16px;' +
					'border:2px solid #F2C230;">' +
					'fruit-board.js was not loaded by the browser.' +
					'</div>'
				);

				document.getElementById('fruit_captions_div').style.display = '';
			}

			return;
		}


		/*
		 * ---------------------------------------------------------
		 * CLEAR OLD TEAM DATA
		 * ---------------------------------------------------------
		 */
		$('#fruit_captions_div').empty();
		$('#fruit_teams_div').empty();


		if(!dataToProcess || !dataToProcess.setup){
			return;
		}


		var setup = dataToProcess.setup;

		var homeSquad = setup.homeSquad || [];
		var awaySquad = setup.awaySquad || [];


		/*
		 * ---------------------------------------------------------
		 * GET SUBSTITUTE DATA
		 *
		 * First we check for a separate substitute array.
		 *
		 * Supported names:
		 *
		 * homeSubstitute
		 * homeSubstitutes
		 * homeSubs
		 * homeSub
		 * homeBench
		 *
		 * Same for away.
		 *
		 * If no separate array exists, players after the
		 * first 11 players are treated as substitutes.
		 * ---------------------------------------------------------
		 */
		function getSubstitutes(side, squad){

			var possibleNames = [
				side + 'Substitute',
				side + 'Substitutes',
				side + 'Subs',
				side + 'Sub',
				side + 'Bench'
			];

			var substitutes = [];

			for(var i = 0; i < possibleNames.length; i++){

				var value = setup[possibleNames[i]];

				if(Array.isArray(value)){

					substitutes = value;
					break;
				}
			}


			/*
			 * If backend does not have a separate substitute array,
			 * consider players after the first 11 as substitutes.
			 */
			if(substitutes.length === 0 && squad.length > 11){

				substitutes = squad.slice(11);
			}

			return substitutes;
		}


		var homeSubstitutes = getSubstitutes('home', homeSquad);
		var awaySubstitutes = getSubstitutes('away', awaySquad);


		/*
		 * ---------------------------------------------------------
		 * REMOVE SUBSTITUTES FROM PLAYING SQUAD
		 *
		 * This is important when the backend sends 12/13 players
		 * inside homeSquad / awaySquad.
		 * ---------------------------------------------------------
		 */
		if(
			homeSubstitutes.length > 0 &&
			!Array.isArray(setup.homeSubstitute) &&
			!Array.isArray(setup.homeSubstitutes) &&
			!Array.isArray(setup.homeSubs) &&
			!Array.isArray(setup.homeSub) &&
			!Array.isArray(setup.homeBench)
		){
			homeSquad = homeSquad.slice(0, 11);
		}


		if(
			awaySubstitutes.length > 0 &&
			!Array.isArray(setup.awaySubstitute) &&
			!Array.isArray(setup.awaySubstitutes) &&
			!Array.isArray(setup.awaySubs) &&
			!Array.isArray(setup.awaySub) &&
			!Array.isArray(setup.awayBench)
		){
			awaySquad = awaySquad.slice(0, 11);
		}


		/*
		 * ---------------------------------------------------------
		 * DETERMINE WHETHER SUBSTITUTE COLUMNS ARE REQUIRED
		 * ---------------------------------------------------------
		 */
		var hasHomeSubstitutes = homeSubstitutes.length > 0;
		var hasAwaySubstitutes = awaySubstitutes.length > 0;

		var hasSubstitutes = hasHomeSubstitutes || hasAwaySubstitutes;


		/*
		 * ---------------------------------------------------------
		 * FIND TOSS INFORMATION
		 * ---------------------------------------------------------
		 */
		var tossText = '';

		if(dataToProcess.match && dataToProcess.match.inning){

			dataToProcess.match.inning.forEach(function(inn){

				if(inn.isCurrentInning == 'YES' && inn.stats){

					if(inn.stats.TOSS){

						tossText = String(inn.stats.TOSS).toUpperCase();

						/*
						 * Keep the original toss sentence, but replace a short
						 * team-name token with the configured full team name.
						 */
						var homeFullTeamName = String(
							(setup.homeTeam && setup.homeTeam.teamName1) || ''
						).toUpperCase();

						var awayFullTeamName = String(
							(setup.awayTeam && setup.awayTeam.teamName1) || ''
						).toUpperCase();

						function replaceShortTeamName(toss, fullName){

							if(!fullName || toss.indexOf(fullName) !== -1){
								return toss;
							}

							var parts = fullName.trim().split(/\s+/);

							if(parts.length === 0){
								return toss;
							}

							var shortName = parts[parts.length - 1];

							if(!shortName){
								return toss;
							}

							return toss.replace(
								new RegExp('\\b' + shortName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'g'),
								fullName
							);
						}

						tossText = replaceShortTeamName(tossText, homeFullTeamName);
						tossText = replaceShortTeamName(tossText, awayFullTeamName);
					}
				}
			});
		}


		/*
		 * ---------------------------------------------------------
		 * CREATE MAIN TABLE
		 * ---------------------------------------------------------
		 */
		var table_team = document.createElement('table');

		table_team.className = 'table table-bordered';

		table_team.style.width = '100%';
		table_team.style.height = '100vh';
		table_team.style.margin = '0';
		table_team.style.padding = '0';
		table_team.style.tableLayout = 'fixed';
		table_team.style.borderCollapse = 'collapse';
		table_team.style.fontFamily = 'Rockwell, Georgia, serif';
		table_team.style.backgroundColor = '#F2C230';


		var tbody = document.createElement('tbody');

		table_team.appendChild(tbody);


		/*
		 * ---------------------------------------------------------
		 * COLUMN COUNT
		 *
		 * WITH SUBSTITUTE:
		 *
		 * HOME SQUAD | SUBSTITUTE | AWAY SQUAD | SUBSTITUTE
		 *
		 * WITHOUT SUBSTITUTE:
		 *
		 * HOME SQUAD | AWAY SQUAD
		 * ---------------------------------------------------------
		 */
		var columnCount = hasSubstitutes ? 4 : 2;


		/*
		 * ---------------------------------------------------------
		 * HELPER - CREATE CELL
		 * ---------------------------------------------------------
		 */
		function createCell(row, text, colspan){

			var cell = row.insertCell(-1);

			cell.innerHTML = text || '';

			if(colspan){
				cell.colSpan = colspan;
			}

			cell.style.border = '1px solid #111';
			cell.style.textAlign = 'center';
			cell.style.verticalAlign = 'middle';
			cell.style.padding = '0';

			return cell;
		}


		/*
		 * ---------------------------------------------------------
		 * HEADER
		 * ---------------------------------------------------------
		 */
		var headerRow = tbody.insertRow(-1);

		var headerCell = createCell(
			headerRow,
			'',
			columnCount
		);

		headerCell.style.padding = '0';
		headerCell.style.border = 'none';
		headerCell.style.height = '70px';

		var headerHTML = '';

		headerHTML += '<div class="fb-header">';
		headerHTML += '  <div class="fb-logo"><img class="fb-logo-image" src="resources/Images/doad_logo_header.png"  alt="Design on a Dime"> Design on a Dime</div>';
		headerHTML += '  <div class="fb-title">';
		headerHTML += '    <div class="fb-tourney">' +
			String(setup.tournament || '').toUpperCase() +
		'</div>';
		headerHTML += '    <div class="fb-match">' +
			String(setup.matchIdent || '').toUpperCase() +
			' : ' +
			String((setup.homeTeam && setup.homeTeam.teamName4) || '').toUpperCase() +
			' vs ' +
			String((setup.awayTeam && setup.awayTeam.teamName4) || '').toUpperCase() +
		'</div>';
		headerHTML += '  </div>';
		headerHTML += '</div>';

		headerCell.innerHTML = headerHTML;


		/*
		 * ---------------------------------------------------------
		 * TEAM NAME ROW
		 * ---------------------------------------------------------
		 */
		var teamRow = tbody.insertRow(-1);


		if(hasSubstitutes){

			var homeTeamCell = createCell(
				teamRow,
				setup.homeTeam.teamName1,
				2
			);

			var awayTeamCell = createCell(
				teamRow,
				setup.awayTeam.teamName1,
				2
			);

			homeTeamCell.style.width = '50%';
			awayTeamCell.style.width = '50%';

			homeTeamCell.className += ' fb-team-cell';
			awayTeamCell.className += ' fb-team-cell';

			homeTeamCell.style.backgroundColor = '#F2C230';
			awayTeamCell.style.backgroundColor = '#F2C230';

			homeTeamCell.style.fontSize = '34px';
			awayTeamCell.style.fontSize = '34px';

			homeTeamCell.style.fontWeight = '900';
			awayTeamCell.style.fontWeight = '900';

			homeTeamCell.style.height = '60px';
			awayTeamCell.style.height = '60px';

		}else{

			var homeTeamCell = createCell(
				teamRow,
				setup.homeTeam.teamName1
			);

			var awayTeamCell = createCell(
				teamRow,
				setup.awayTeam.teamName1
			);

			homeTeamCell.style.width = '50%';
			awayTeamCell.style.width = '50%';

			homeTeamCell.className += ' fb-team-cell';
			awayTeamCell.className += ' fb-team-cell';

			homeTeamCell.style.fontSize = '34px';
			awayTeamCell.style.fontSize = '34px';

			homeTeamCell.style.fontWeight = '900';
			awayTeamCell.style.fontWeight = '900';

			homeTeamCell.style.height = '60px';
			awayTeamCell.style.height = '60px';
		}


		/*
		 * ---------------------------------------------------------
		 * COLUMN HEADER
		 * ---------------------------------------------------------
		 */
		var columnHeaderRow = tbody.insertRow(-1);


		if(hasSubstitutes){

			var h1 = createCell(columnHeaderRow, 'PLAYING 11');
			var h2 = createCell(columnHeaderRow, 'IMP/SUB OPTIONS');
			var h3 = createCell(columnHeaderRow, 'PLAYING 11');
			var h4 = createCell(columnHeaderRow, 'IMP/SUB OPTIONS');

			h1.style.width = '25%';
			h2.style.width = '25%';
			h3.style.width = '25%';
			h4.style.width = '25%';

			[h1,h2,h3,h4].forEach(function(cell){

				cell.className += ' fb-column-head';

				cell.style.height = '45px';
				cell.style.backgroundColor = '#F2C230';
				cell.style.fontSize = '22px';
				cell.style.fontWeight = '900';

			});

		}else{

			var h1 = createCell(columnHeaderRow, 'PLAYING 11');
			var h2 = createCell(columnHeaderRow, 'PLAYING 11');

			h1.style.width = '50%';
			h2.style.width = '50%';

			[h1,h2].forEach(function(cell){

				cell.className += ' fb-column-head';

				cell.style.height = '45px';
				cell.style.backgroundColor = '#F2C230';
				cell.style.fontSize = '22px';
				cell.style.fontWeight = '900';

			});
		}


		/*
		 * ---------------------------------------------------------
		 * PLAYER NAME HELPER
		 * ---------------------------------------------------------
		 */
		function getPlayerName(player){

			if(!player){
				return '';
			}

			var name = player.full_name || player.name || '';

			if(player.captainWicketKeeper == 'wicket_keeper'){

				name += ' (WK)';

			}else if(player.captainWicketKeeper == 'captain'){

				name += ' (C)';

			}else if(player.captainWicketKeeper == 'captain_wicket_keeper'){

				name += ' (C&WK)';
			}

			return name;
		}


		/*
		 * ---------------------------------------------------------
		 * PLAYER ROWS
		 * ---------------------------------------------------------
		 */
		var maxRows = Math.max(
			homeSquad.length,
			awaySquad.length,
			homeSubstitutes.length,
			awaySubstitutes.length,
			11
		);


		for(var i = 0; i < maxRows; i++){

			var playerRow = tbody.insertRow(-1);


			if(hasSubstitutes){

				var homePlayerCell = createCell(
					playerRow,
					getPlayerName(homeSquad[i])
				);

				var homeSubCell = createCell(
					playerRow,
					getPlayerName(homeSubstitutes[i])
				);

				var awayPlayerCell = createCell(
					playerRow,
					getPlayerName(awaySquad[i])
				);

				var awaySubCell = createCell(
					playerRow,
					getPlayerName(awaySubstitutes[i])
				);


				homePlayerCell.style.width = '25%';
				homeSubCell.style.width = '25%';
				awayPlayerCell.style.width = '25%';
				awaySubCell.style.width = '25%';


				[
					homePlayerCell,
					homeSubCell,
					awayPlayerCell,
					awaySubCell
				].forEach(function(cell){

					cell.className += ' fb-player-cell';

					cell.style.backgroundColor = '#F2C230';
					cell.style.fontSize = '25px';
					cell.style.fontWeight = '700';
					cell.style.height = '48px';

				});


				/*
				 * Substitute cells get slightly different
				 * visual treatment.
				 */
				homeSubCell.className += ' fb-substitute-cell';
				awaySubCell.className += ' fb-substitute-cell';

				homeSubCell.style.backgroundColor = '#E6B91F';
				awaySubCell.style.backgroundColor = '#E6B91F';


			}else{

				var homePlayerCell = createCell(
					playerRow,
					getPlayerName(homeSquad[i])
				);

				var awayPlayerCell = createCell(
					playerRow,
					getPlayerName(awaySquad[i])
				);


				homePlayerCell.style.width = '50%';
				awayPlayerCell.style.width = '50%';


				[
					homePlayerCell,
					awayPlayerCell
				].forEach(function(cell){

					cell.className += ' fb-player-cell';

					cell.style.backgroundColor = '#F2C230';
					cell.style.fontSize = '25px';
					cell.style.fontWeight = '700';
					cell.style.height = '48px';

				});
			}
		}


		/*
		 * ---------------------------------------------------------
		 * FOOTER / TOSS
		 * ---------------------------------------------------------
		 */
		var footerRow = tbody.insertRow(-1);

		var footerCell = createCell(
			footerRow,
			tossText,
			columnCount
		);


		footerCell.className += ' fb-footer-cell';

		footerCell.style.backgroundColor = '#0A1747';
		footerCell.style.color = '#FFFFFF';
		footerCell.style.fontSize = '28px';
		footerCell.style.fontWeight = '900';
		footerCell.style.height = '55px';
		footerCell.style.textAlign = 'center';
		footerCell.style.verticalAlign = 'middle';



		/*
		 * ---------------------------------------------------------
		 * PREMIUM TEAMS GRAPHIC CSS
		 *
		 * Uses the same Royal Navy + Gold visual language as the
		 * supplied Fruit scoreboard CSS. This changes styling only;
		 * no Teams data or data-selection logic is changed.
		 * ---------------------------------------------------------
		 */
		if(!document.getElementById('fb-teams-premium-style')){

			var teamsStyle = document.createElement('style');
			teamsStyle.id = 'fb-teams-premium-style';

			teamsStyle.innerHTML =
				'html, body{' +
					'margin:0 !important;' +
					'padding:0 !important;' +
					'width:100% !important;' +
					'height:100% !important;' +
					'overflow:hidden !important;' +
					'background:#0A1747 !important;' +
				'}' +

				'#fruit_teams_div{' +
					'position:fixed !important;' +
					'top:0 !important;' +
					'left:0 !important;' +
					'right:0 !important;' +
					'bottom:0 !important;' +
					'width:100vw !important;' +
					'height:100vh !important;' +
					'margin:0 !important;' +
					'padding:0 !important;' +
					'overflow:hidden !important;' +
					'background:#0A1747 !important;' +
					'box-sizing:border-box !important;' +
				'}' +

				'#fruit_teams_div table{' +
					'width:100% !important;' +
					'height:100% !important;' +
					'margin:0 !important;' +
					'padding:0 !important;' +
					'border-collapse:collapse !important;' +
					'table-layout:fixed !important;' +
					'background:#0A1747 !important;' +
					'font-family:"Oswald","Segoe UI",Arial,sans-serif !important;' +
				'}' +

				'#fruit_teams_div td{' +
					'border:1px solid #000 !important;' +
					'padding:4px 8px !important;' +
					'box-sizing:border-box !important;' +
					'overflow:hidden !important;' +
					'white-space:nowrap !important;' +
					'text-overflow:ellipsis !important;' +
					'vertical-align:middle !important;' +
					'text-align:center !important;' +
				'}' +

				'#fruit_teams_div .fb-header{' +
					'width:100% !important;' +
					'height:88px !important;' +
					'min-height:88px !important;' +
					'display:block !important;' +
					'position:relative !important;' +
					'box-sizing:border-box !important;' +
					'background:linear-gradient(180deg,#16276B 0%,#0A1747 58%,#060C29 100%) !important;' +
					'border:2px solid #000 !important;' +
					'overflow:hidden !important;' +
					'text-align:left !important;' +
				'}' +

				'#fruit_teams_div .fb-header:before{' +
					'content:"" !important;' +
					'position:absolute !important;' +
					'inset:0 !important;' +
					'background:linear-gradient(180deg,rgba(255,255,255,.12) 0%,rgba(255,255,255,0) 38%) !important;' +
					'pointer-events:none !important;' +
				'}' +

				'#fruit_teams_div .fb-logo{' +
					'position:absolute !important;' +
					'left:18px !important;' +
					'top:50% !important;' +
					'transform:translateY(-50%) !important;' +
					'z-index:2 !important;' +
					'display:flex !important;' +
					'align-items:center !important;' +
					'gap:10px !important;' +
					'padding:8px 14px !important;' +
					'color:#fff !important;' +
					'font-family:"Oswald","Segoe UI",Arial,sans-serif !important;' +
					'font-weight:700 !important;' +
					'letter-spacing:.5px !important;' +
					'font-size:clamp(18px,1.35vw,25px) !important;' +
					'white-space:nowrap !important;' +
				'}' +

				'#fruit_teams_div .fb-logo-mark{' +
					'display:none !important;' +
				'}' +

				'#fruit_teams_div .fb-logo-image{' +
					'height:46px !important;' +
					'width:auto !important;' +
					'max-width:54px !important;' +
					'object-fit:contain !important;' +
					'display:block !important;' +
					'flex:0 0 auto !important;' +
				'}' +

				'#fruit_teams_div .fb-logo-mark{' +
					'width:42px !important;' +
					'height:42px !important;' +
					'min-width:42px !important;' +
					'border-radius:50% !important;' +
					'background:linear-gradient(180deg,#2A3B8A,#0A1747) !important;' +
					'display:flex !important;' +
					'align-items:center !important;' +
					'justify-content:center !important;' +
					'font-size:18px !important;' +
					'color:#F2C230 !important;' +
					'border:2px solid #F2C230 !important;' +
					'box-sizing:border-box !important;' +
				'}' +

				'#fruit_teams_div .fb-title{' +
					'position:absolute !important;' +
					'left:50% !important;' +
					'top:50% !important;' +
					'transform:translate(-50%,-50%) !important;' +
					'z-index:1 !important;' +
					'width:78% !important;' +
					'text-align:center !important;' +
					'padding:6px 10px !important;' +
					'line-height:1.15 !important;' +
					'box-sizing:border-box !important;' +
				'}' +

				'#fruit_teams_div .fb-tourney{' +
					'font-family:"Rajdhani","Segoe UI",Arial,sans-serif !important;' +
					'font-size:clamp(21px,1.55vw,28px) !important;' +
					'font-weight:800 !important;' +
					'letter-spacing:2px !important;' +
					'color:#F7D774 !important;' +
					'margin-bottom:2px !important;' +
				'}' +

				'#fruit_teams_div .fb-match{' +
					'font-family:"Oswald","Segoe UI",Arial,sans-serif !important;' +
					'font-size:clamp(24px,2.15vw,34px) !important;' +
					'font-weight:800 !important;' +
					'letter-spacing:1px !important;' +
					'color:#fff !important;' +
					'text-shadow:0 2px 4px rgba(0,0,0,.6) !important;' +
				'}' +

				'#fruit_teams_div .fb-team-cell{' +
					'background:linear-gradient(180deg,#FFE9A8 0%,#F2C230 50%,#C9971A 100%) !important;' +
					'color:#0A1747 !important;' +
					'font-family:"Oswald","Segoe UI",Arial,sans-serif !important;' +
					'font-size:clamp(27px,2.15vw,38px) !important;' +
					'font-weight:900 !important;' +
					'letter-spacing:.8px !important;' +
					'text-shadow:0 1px 0 rgba(255,255,255,.25) !important;' +
				'}' +

				'#fruit_teams_div .fb-column-head{' +
					'background:linear-gradient(180deg,#16276B 0%,#0A1747 100%) !important;' +
					'color:#F7D774 !important;' +
					'font-family:"Oswald","Segoe UI",Arial,sans-serif !important;' +
					'font-size:clamp(18px,1.35vw,24px) !important;' +
					'font-weight:800 !important;' +
					'letter-spacing:1px !important;' +
				'}' +

				'#fruit_teams_div .fb-player-cell{' +
					'background:#0A1747 !important;' +
					'color:#fff !important;' +
					'font-family:"Oswald","Segoe UI",Arial,sans-serif !important;' +
					'font-size:clamp(20px,1.55vw,28px) !important;' +
					'font-weight:700 !important;' +
					'letter-spacing:.3px !important;' +
				'}' +

				'#fruit_teams_div .fb-player-cell:nth-child(odd){' +
					'background:#0F2050 !important;' +
				'}' +

				'#fruit_teams_div .fb-substitute-cell{' +
					'background:#16276B !important;' +
					'color:#F7D774 !important;' +
				'}' +

				'#fruit_teams_div .fb-footer-cell{' +
					'background:linear-gradient(180deg,#16276B 0%,#0A1747 55%,#060C29 100%) !important;' +
					'color:#fff !important;' +
					'font-family:"Oswald","Segoe UI",Arial,sans-serif !important;' +
					'font-size:clamp(22px,1.75vw,31px) !important;' +
					'font-weight:900 !important;' +
					'letter-spacing:1px !important;' +
				'}' +

				'#fruit_teams_div td{' +
					'border-color:#000 !important;' +
				'}';

			document.head.appendChild(teamsStyle);
		}


		if($('#select_page').val() == 'teams'){

			/*
			 * Append the existing Teams table first.
			 * The table itself contains the new fb-header row.
			 */
			$('#fruit_teams_div').append(table_team);

			table_team.style.width = '100%';
			table_team.style.height = '100%';
			table_team.style.margin = '0';
			table_team.style.padding = '0';
			table_team.style.boxSizing = 'border-box';

			/*
			 * Full viewport - remove browser/page spacing.
			 */
			$('html, body').css({
				'margin': '0',
				'padding': '0',
				'width': '100%',
				'height': '100%',
				'overflow': 'hidden'
			});

			$('#fruit_teams_div').css({
				'position': 'fixed',
				'top': '0',
				'left': '0',
				'margin': '0',
				'padding': '0',
				'width': '100vw',
				'height': '100vh',
				'overflow': 'hidden',
				'box-sizing': 'border-box'
			});

			document.getElementById('fruit_teams_div').style.display = '';

		}


		if($('#select_page').val() == 'ident'){

			document.getElementById('fruit_ident_div').style.display = '';

		}


		/*
		 * Prevent browser scrolling.
		 */
		$("body").css("overflow", "hidden");


		break;
	}
}
function checkEmpty(inputBox,textToShow) {

	var name = $(inputBox).attr('id');
	
	document.getElementById(name + '-validation').innerHTML = '';
	document.getElementById(name + '-validation').style.display = 'none';
	$(inputBox).css('border','');
	if(document.getElementById(name).value.trim() == '') {
		$(inputBox).css('border','#D42027 2px solid');
		document.getElementById(name + '-validation').innerHTML = textToShow + ' required';
		document.getElementById(name + '-validation').style.display = '';
		document.getElementById(name).focus({preventScroll:false});
		return false;
	}
	return true;	
}