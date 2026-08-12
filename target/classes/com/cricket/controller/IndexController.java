package com.cricket.controller;

import java.io.File;
import java.io.FileFilter;
import java.io.IOException;
import java.lang.reflect.InvocationTargetException;
import java.net.URISyntaxException;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.xml.bind.JAXBContext;
import jakarta.xml.bind.JAXBException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.ModelMap;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import com.cricket.containers.Configurations;
import com.cricket.containers.Functions;
import com.cricket.model.BattingCard;
import com.cricket.model.BowlingCard;
import com.cricket.model.EventFile;
import com.cricket.model.Ground;
import com.cricket.model.Inning;
import com.cricket.model.Match;
import com.cricket.model.MatchAllData;
import com.cricket.model.Player;
import com.cricket.model.Setup;
import com.cricket.model.Team;
import com.cricket.service.CricketService;
import com.cricket.util.CricketFunctions;
import com.cricket.util.CricketUtil;
import com.Ae_Third_Party_Xml.AE_Last_Ball;
import com.fasterxml.jackson.core.exc.StreamWriteException;
import com.fasterxml.jackson.databind.DatabindException;
import com.fasterxml.jackson.databind.ObjectMapper;

@Controller
public class IndexController
{
	@Autowired
	CricketService cricketService;

	public static Configurations session_Configurations;
	public static MatchAllData session_match;
	public static String session_selected_broadcaster;
	String session_selected_page;
	boolean bowler_Found = false;
	public boolean match_file_change = false;
	public static long time_elapsed = 0;
	public static long last_setup_time_stamp = 0;
	public static long last_match_time_stamp = 0;
	public static long last_event_time_stamp = 0;
	public static List<Team> session_team = new ArrayList<>();
	public static List<Ground> session_ground = new ArrayList<>();
	public static List<Player> session_players = new ArrayList<>();
	public static ObjectMapper objectMapper = new ObjectMapper();
	int bowler = 0;

	@RequestMapping(value = {"/","/initialise"}, method={RequestMethod.GET,RequestMethod.POST})
	public String initialisePage(ModelMap model) throws JAXBException
	{
		model.addAttribute("match_files", new File(CricketUtil.CRICKET_DIRECTORY + CricketUtil.MATCHES_DIRECTORY).listFiles(new FileFilter() {
			@Override
		    public boolean accept(File pathname) {
		        String name = pathname.getName().toLowerCase();
		        return name.endsWith(".json") && pathname.isFile();
		    }
		}));

		if(new File(CricketUtil.CRICKET_DIRECTORY + CricketUtil.CONFIGURATIONS_DIRECTORY + CricketUtil.COMMENTATOR_XML).exists()) {
            session_Configurations = (Configurations)JAXBContext.newInstance(Configurations.class).createUnmarshaller().unmarshal(
                    new File(CricketUtil.CRICKET_DIRECTORY + CricketUtil.CONFIGURATIONS_DIRECTORY + CricketUtil.COMMENTATOR_XML));
        } else {
            session_Configurations = new Configurations();
			JAXBContext.newInstance(Configurations.class).createMarshaller().marshal(session_Configurations,
					new File(CricketUtil.CRICKET_DIRECTORY + CricketUtil.CONFIGURATIONS_DIRECTORY + CricketUtil.COMMENTATOR_XML));
        }
		return "initialise";
	}

	@RequestMapping(value = {"/change_to_teams","/change_to_ident","/change_to_fruit"}, method={RequestMethod.GET,RequestMethod.POST})
	public String processUserSelectionData(ModelMap model,HttpServletRequest request)
					throws IllegalAccessException, InvocationTargetException, JAXBException, StreamWriteException, DatabindException, IOException, URISyntaxException
	{
		if(request.getRequestURI().contains("change_to_teams")) {
			session_selected_page = "teams";
			model.addAttribute("session_selected_page", session_selected_page);
			model.addAttribute("session_match", session_match);
			return "teams";
		}else if(request.getRequestURI().contains("change_to_ident")) {
			session_selected_page = "ident";
			model.addAttribute("session_selected_page", session_selected_page);
			model.addAttribute("session_match", session_match);
			return "ident";
		}else {
			session_selected_page = "fruit";
			model.addAttribute("session_selected_page", session_selected_page);
			model.addAttribute("session_match", session_match);
			return "fruit";
		}
	}

	@RequestMapping(value = {"/commentator"}, method={RequestMethod.GET,RequestMethod.POST})
	public String commentatorPage(ModelMap model,
			@RequestParam(value = "select_page", required = false, defaultValue = "") String select_page,
			@RequestParam(value = "select_inning", required = false, defaultValue = "") String select_inning,
			@RequestParam(value = "select_broadcaster", required = false, defaultValue = "") String select_broadcaster,
			@RequestParam(value = "select_cricket_matches", required = false, defaultValue = "") String selectedMatch)
					throws IllegalAccessException, InvocationTargetException, JAXBException, StreamWriteException, DatabindException, IOException, URISyntaxException
	{
		session_selected_page = select_page;
		session_selected_broadcaster = select_broadcaster;

		last_match_time_stamp = new File(CricketUtil.CRICKET_DIRECTORY + CricketUtil.MATCHES_DIRECTORY + selectedMatch).lastModified();
		last_setup_time_stamp = new File(CricketUtil.CRICKET_DIRECTORY + CricketUtil.SETUP_DIRECTORY + selectedMatch).lastModified();
		last_event_time_stamp = new File(CricketUtil.CRICKET_DIRECTORY + CricketUtil.EVENT_DIRECTORY + selectedMatch).lastModified();

		session_Configurations = new Configurations(selectedMatch, select_broadcaster);

		JAXBContext.newInstance(Configurations.class).createMarshaller().marshal(session_Configurations,
				new File(CricketUtil.CRICKET_DIRECTORY + CricketUtil.CONFIGURATIONS_DIRECTORY + CricketUtil.COMMENTATOR_XML));
		//session_match.setMatch(new Match());
		session_match = new MatchAllData();
		if(new File(CricketUtil.CRICKET_DIRECTORY + CricketUtil.SETUP_DIRECTORY +
				selectedMatch).exists()) {
			session_match.setSetup(new ObjectMapper().readValue(new File(CricketUtil.CRICKET_DIRECTORY + CricketUtil.SETUP_DIRECTORY +
					selectedMatch), Setup.class));
			session_match.setMatch(new ObjectMapper().readValue(new File(CricketUtil.CRICKET_DIRECTORY + CricketUtil.MATCHES_DIRECTORY +
					selectedMatch), Match.class));
		}
		if(new File(CricketUtil.CRICKET_DIRECTORY + CricketUtil.EVENT_DIRECTORY +
				selectedMatch).exists()) {
			session_match.setEventFile(new ObjectMapper().readValue(new File(CricketUtil.CRICKET_DIRECTORY + CricketUtil.EVENT_DIRECTORY +
					selectedMatch), EventFile.class));
		}

		session_team =  cricketService.getTeams();
		session_ground =  cricketService.getGrounds();
		session_players = cricketService.getAllPlayer();

		session_match.getMatch().setMatchFileName(selectedMatch);
		session_match = CricketFunctions.populateMatchVariables(
			CricketFunctions.readOrSaveMatchFile(CricketUtil.READ,CricketUtil.SETUP + "," + CricketUtil.MATCH + ","
			+ CricketUtil.EVENT, session_match, false), session_players, session_team, session_ground);
		session_match.getSetup().setMatchFileTimeStamp(new SimpleDateFormat("dd-MM-yyyy HH:mm:ss").format(new Date()));

		model.addAttribute("session_selected_page", session_selected_page);
		model.addAttribute("session_match", session_match);
		model.addAttribute("session_selected_broadcaster", session_selected_broadcaster);
		switch(session_selected_page) {
		case "fruit":
			return "fruit";
		case "teams":
			return "teams";
		case "ident":
			return "ident";
		}
		return null;
	}

	@RequestMapping(value = {"/processCricketProcedures.html"}, method={RequestMethod.GET,RequestMethod.POST})
	public @ResponseBody String processCricketProcedures(
			@RequestParam(value = "whatToProcess", required = false, defaultValue = "") String whatToProcess,
			@RequestParam(value = "valueToProcess", required = false, defaultValue = "") String valueToProcess)
					throws IOException, IllegalAccessException, InvocationTargetException, JAXBException, URISyntaxException, InterruptedException
	{
		switch (whatToProcess.toUpperCase()) {
		case "CHECK-NUMBER-INNINGS":

			session_match = CricketFunctions.populateMatchVariables(
				CricketFunctions.readOrSaveMatchFile(CricketUtil.READ,CricketUtil.SETUP + "," + CricketUtil.MATCH + ","
				+ CricketUtil.EVENT, session_match, false), session_players, session_team, session_ground);

			return objectMapper.writeValueAsString(session_match);

		case "READ-MATCH-AND-POPULATE":

			match_file_change = false;

			long currentMatchTimeStamp = new File(
					CricketUtil.CRICKET_DIRECTORY
					+ CricketUtil.MATCHES_DIRECTORY
					+ session_match.getMatch().getMatchFileName()
			).lastModified();

			long currentEventTimeStamp = new File(
					CricketUtil.CRICKET_DIRECTORY
					+ CricketUtil.EVENT_DIRECTORY
					+ session_match.getMatch().getMatchFileName()
			).lastModified();

			if(last_match_time_stamp != currentMatchTimeStamp
					|| last_event_time_stamp != currentEventTimeStamp) {

				session_match = CricketFunctions.populateMatchVariables(
						CricketFunctions.readOrSaveMatchFile(
								CricketUtil.READ,
								CricketUtil.SETUP + "," + CricketUtil.MATCH + "," + CricketUtil.EVENT,
								session_match,
								false
						),
						session_players,
						session_team,
						session_ground
				);

				match_file_change = true;
			}
			
//				session_match = CricketFunctions.populateMatchVariables(cricketService, CricketFunctions.readOrSaveMatchFile(CricketUtil.READ,CricketUtil.SETUP + "," + 
//						CricketUtil.MATCH + "," + CricketUtil.EVENT, session_match));
			if(match_file_change == true) {
				int Player_id = 0;
				for(Inning inn : session_match.getMatch().getInning()){
					
					Map<String, String> this_stats = new HashMap<String,String>();
					this_stats.put(CricketUtil.OVER + inn.getInningNumber(), CricketFunctions.OverBalls(inn.getTotalOvers(), inn.getTotalBalls()));
					
					if(inn.getInningNumber() == 2) {
						// Current batting team's live score at the current stage.
						this_stats.put("TEAM_ATSTAGE",
								inn.getTotalRuns() + "-" + inn.getTotalWickets());

						// First-innings score at the same over/ball position.
						this_stats.put("OPP_ATSTAGE", this_stats.get(CricketUtil.COMPARE));
					}
					this_stats.put(CricketUtil.TOSS, CricketFunctions.generateTossResult(session_match,CricketUtil.SHORT, "", CricketUtil.SHORT, ""));
					this_stats.put("DOTBALLS" + inn.getInningNumber(), Functions.countDotBalls(inn.getInningNumber(), session_match.getEventFile().getEvents()));

					String phaseWiseScore = CricketFunctions.getPhaseWiseScore(session_match, inn.getInningNumber(), session_match.getEventFile().getEvents());
					System.out.println("phaseWiseScore-------------------------------"+phaseWiseScore);
						if(phaseWiseScore != null && !phaseWiseScore.trim().isEmpty()) {
						    String[] phases = phaseWiseScore.split("_");
						    System.out.println("phases----------------------------------"+phases);
						    if(phases.length > 0) {
						        this_stats.put("PHASE1", phases[0].split("\\|")[0].replace(",", "-"));
						    }
						    if(phases.length > 1) {
						        this_stats.put("PHASE2", phases[1].split("\\|")[0].replace(",", "-"));
						    }
						    if(phases.length > 2) {
						        this_stats.put("PHASE3", phases[2].split("\\|")[0].replace(",", "-"));
						    }
						} else {
						    this_stats.put("PHASE1", "-");
						    this_stats.put("PHASE2", "-");
						    this_stats.put("PHASE3", "-");
						}

					
					Inning oppInningForStage = Functions.findOpponentInning(session_match, inn);
					this_stats.put("TEAM_FOURS", String.valueOf(inn.getTotalFours()));
					this_stats.put("TEAM_SIXES", String.valueOf(inn.getTotalSixes()));
					this_stats.put("TEAM_DOTS", String.valueOf(inn.getDots()));
					this_stats.put("REVIEWS", String.valueOf(Functions.countReviewsForTeam(inn.getReviews(), inn.getBattingTeamId())));
					if(oppInningForStage != null) {
						this_stats.put("OPP_FOURS", String.valueOf(oppInningForStage.getTotalFours()));
						this_stats.put("OPP_SIXES", String.valueOf(oppInningForStage.getTotalSixes()));
						this_stats.put("OPP_DOTS", String.valueOf(oppInningForStage.getDots()));
						this_stats.put("OPP_REVIEWS", String.valueOf(Functions.countReviewsForTeam(oppInningForStage.getReviews(), oppInningForStage.getBattingTeamId())));
					}
					
					if(inn.getIsCurrentInning().equalsIgnoreCase(CricketUtil.YES)) {
						for(BattingCard bc : inn.getBattingCard()) {
							if(bc.getStatus().equalsIgnoreCase(CricketUtil.NOT_OUT) && bc.getOnStrike().equalsIgnoreCase(CricketUtil.YES)) {
								this_stats.put("BATSMAN1DOTS",  CricketFunctions.getScoreTypeData(CricketUtil.BATSMAN,session_match, inn.getInningNumber(), bc.getPlayerId(),",", 
										session_match.getEventFile().getEvents()));
							}
							if(bc.getStatus().equalsIgnoreCase(CricketUtil.NOT_OUT) && bc.getOnStrike().equalsIgnoreCase(CricketUtil.NO)) {
								this_stats.put("BATSMAN2DOTS",  CricketFunctions.getScoreTypeData(CricketUtil.BATSMAN,session_match, inn.getInningNumber(), bc.getPlayerId(),",", 
										session_match.getEventFile().getEvents()));
							}
							if(inn.getFallsOfWickets() != null) {
								if(inn.getFallsOfWickets().size() >=0) {
									if(inn.getFallsOfWickets().get(inn.getFallsOfWickets().size() -1).getFowPlayerID() == bc.getPlayerId()) {
										this_stats.put("BATSMAN_OUT",  CricketFunctions.getScoreTypeData(CricketUtil.BATSMAN,session_match, inn.getInningNumber(), bc.getPlayerId(),",", 
												session_match.getEventFile().getEvents()));
									}
								}
							}
						}
						
						this_stats.put("DLS", Functions.dls(session_match));
						this_stats.put("DLS_EQUATION", Functions.populateDls(session_match));
						this_stats.put("PREVIOUS_BOWLER", CricketFunctions.previousBowler(session_match, session_match.getEventFile().getEvents()));
						this_stats.put("OTHER_BOWLER", CricketFunctions.otherBowler(session_match, session_match.getEventFile().getEvents()));
						this_stats.put(CricketUtil.POWERPLAY, CricketFunctions.processPowerPlay(CricketUtil.MINI,session_match));
						//Tushar
						//this_stats.put(CricketUtil.INNING_STATUS, CricketFunctions.generateMatchSummaryStatus(inn.getInningNumber(), session_match, CricketUtil.SHORT).toUpperCase());
						this_stats.put(CricketUtil.PLURAL,CricketFunctions.Plural(inn.getTotalOvers()));
						//Tushar
						//this_stats.put("Req_RR", CricketFunctions.generateRunRate(CricketFunctions.getRequiredRuns(session_match), 0, CricketFunctions.getRequiredBalls(session_match), 2));
						if(inn.getIsCurrentInning().equalsIgnoreCase(CricketUtil.YES)) {
							if(inn.getRunRate() != null && !inn.getRunRate().trim().isEmpty()) {
								try {
									this_stats.put("PS", projectedScoreForCurrentInning(session_match, inn));
								} catch (Exception ex) {
									System.out.println("Unable to calculate projected score: " + ex.getMessage());
								}
							}
						}

						//this_stats.put("PPS", CricketFunctions.getPowerPlayScore(inn,inn.getInningNumber(),'-', session_event_file.getEvents()));
						//System.out.println("LAST 30 BALLS : " + CricketFunctions.getlastthirtyballsdata(session_match, "-", session_event_file.getEvents(), 30));
						this_stats.put(CricketUtil.BOUNDARY, CricketFunctions.lastFewOversData(CricketUtil.BOUNDARY, session_match.getEventFile().getEvents(),inn.getInningNumber()));
						//Collections.reverse(session_match.getEventFile().getEvents());
						
					}
					inn.setStats(this_stats);
				}
				last_match_time_stamp = new File(CricketUtil.CRICKET_DIRECTORY + CricketUtil.MATCHES_DIRECTORY 
						+ session_match.getMatch().getMatchFileName()).lastModified();
				last_setup_time_stamp = new File(CricketUtil.CRICKET_DIRECTORY + CricketUtil.SETUP_DIRECTORY 
						+ session_match.getMatch().getMatchFileName()).lastModified();
				last_event_time_stamp = new File(CricketUtil.CRICKET_DIRECTORY + CricketUtil.EVENT_DIRECTORY
						+ session_match.getMatch().getMatchFileName()).lastModified();
			}
			
			for(Inning inn : session_match.getMatch().getInning()){
				if(inn.getIsCurrentInning().equalsIgnoreCase(CricketUtil.YES)) {
					Map<String, String> stats = inn.getStats();
					if(stats == null){
						stats = new HashMap<String,String>();
					}

					// Last-ball speed is an external/live XML value, so read it on every poll.
					try {
						File speedFile = new File(
								CricketUtil.CRICKET_DIRECTORY
								+ CricketUtil.SPEED_DIRECTORY
								+ CricketUtil.Cricket_LAST_BALL_SPEED_THIRDPARTY
						);

						if(speedFile.exists()) {
							AE_Last_Ball lastBall = CricketFunctions.getSpeed_of_ball_from_ThirdParty(
									 speedFile.getAbsolutePath());

							if(lastBall != null && lastBall.getSpeed() != null
									&& !lastBall.getSpeed().isEmpty()
									&& lastBall.getSpeed().get(0) != null
									&& lastBall.getSpeed().get(0).getValues() != null) {

								String speed = String.valueOf(lastBall.getSpeed().get(0).getValues());
								String unit = lastBall.getSpeed().get(0).getUnit();

								if(unit != null && !unit.trim().isEmpty()) {
									speed += " " + unit;
								}

								stats.put("SPEED", speed);
							}
						}
					} catch(Exception ex) {
						System.out.println("Unable to read last ball speed: " + ex.getMessage());
					}

					stats.put(CricketUtil.BOUNDARY, CricketFunctions.ballsSinceLastBoundary(session_match.getEventFile().getEvents(), inn.getInningNumber()));

					int currentBowlerPlayerId = 0;
					if(inn.getBowlingCard() != null) {
						for(BowlingCard boc : inn.getBowlingCard()) {
							if(boc.getStatus().equalsIgnoreCase(CricketUtil.CURRENT + CricketUtil.BOWLER)
									|| boc.getStatus().equalsIgnoreCase(CricketUtil.LAST + CricketUtil.BOWLER)) {
								currentBowlerPlayerId = boc.getPlayerId();
							}
						}

						// Ball-by-ball CSV for the current/last over -> "OVER" key
						String overText = CricketFunctions.getEventsText(CricketUtil.OVER, currentBowlerPlayerId, ",", session_match.getEventFile().getEvents(), 0).replace("BOUNDARY", "");

						// "runs-ballcount-wickets" -> formatted "X RUNS & Y WICKETS" text -> "ThisOver" key
						String[] thisOverParts = CricketFunctions.processThisOverRunsCount(currentBowlerPlayerId, session_match.getEventFile().getEvents()).split("-");
						int thisOverRuns = Integer.parseInt(thisOverParts[0]);
						int thisOverWickets = Integer.parseInt(thisOverParts[2]);
						String thisOverText = thisOverRuns + " RUN" + CricketFunctions.Plural(thisOverRuns)
								+ (thisOverWickets > 0 ? " & " + thisOverWickets + " WICKET" + CricketFunctions.Plural(thisOverWickets) : "");

						stats.put(CricketUtil.OVER, overText);
						stats.put("ThisOver", thisOverText);

						// Last 30 balls summary -> "LAST_30_BALLS" key
						String[] last30Parts = CricketFunctions.getlastthirtyballsdata(session_match, ",", session_match.getEventFile().getEvents(), 30).split(",");
						int last30Runs = Integer.parseInt(last30Parts[0]);
						int last30Wickets = Integer.parseInt(last30Parts[1]);
						String last30Text = "LAST 30 BALLS: " + last30Runs + " RUN" + CricketFunctions.Plural(last30Runs) 
							+ " & " + last30Wickets + " WICKET" + CricketFunctions.Plural(last30Wickets);
						stats.put("LAST_30_BALLS", last30Text);
					}

					inn.setStats(stats);
				}
			}
			
			return objectMapper.writeValueAsString(session_match);

		default:
			return objectMapper.writeValueAsString(session_match);
		}
	}

	/**
	 * Builds projected-score data for whichever inning is currently active.
	 * The old Functions.ProjectedScore() always used inning[0], which caused
	 * the second innings to show the first innings projection or no projection.
	 * Return format is kept compatible with fruit-board.js:
	 * currentScore,currentRR,scoreAtRR+2,RR+2,scoreAtRR+4,RR+4,scoreAtRR+6,RR+6
	 */
	private static String projectedScoreForCurrentInning(MatchAllData match, Inning inning) {
		if(match == null || match.getSetup() == null || inning == null) {
			return "";
		}

		if(inning.getRunRate() == null || inning.getRunRate().trim().isEmpty()) {
			return "";
		}

		int ballsPerOver = 6;
		if(match.getSetup().getBallsPerOver() != null
				&& !match.getSetup().getBallsPerOver().trim().isEmpty()) {
			ballsPerOver = Integer.parseInt(match.getSetup().getBallsPerOver());
		}

		int totalBalls;
		String targetOvers = match.getSetup().getTargetOvers();

		if(targetOvers != null && !targetOvers.trim().isEmpty()
				&& Double.parseDouble(targetOvers) > 0) {
			if(targetOvers.contains(".")) {
				String[] parts = targetOvers.split("\\.");
				totalBalls = Integer.parseInt(parts[0]) * ballsPerOver
						+ Integer.parseInt(parts[1]);
			} else {
				totalBalls = Integer.parseInt(targetOvers) * ballsPerOver;
			}
		} else {
			totalBalls = match.getSetup().getMaxOvers() * ballsPerOver;
		}

		int ballsBowled = inning.getTotalOvers() * ballsPerOver + inning.getTotalBalls();
		int remainingBalls = Math.max(0, totalBalls - ballsBowled);

		double currentRunRate = Double.parseDouble(inning.getRunRate());
		int totalRuns = inning.getTotalRuns();

		String currentProjected = String.valueOf(
				Math.round(totalRuns + (remainingBalls * currentRunRate) / ballsPerOver)
		);

		int baseRunRate = (int)Math.floor(currentRunRate);

		StringBuilder result = new StringBuilder();
		result.append(currentProjected).append(",").append(inning.getRunRate());

		for(int addRate = 2; addRate <= 6; addRate += 2) {
			double projectedRate = baseRunRate + addRate;
			double projectedRuns = totalRuns
					+ (remainingBalls * projectedRate) / ballsPerOver;

			result.append(",")
					.append(String.valueOf((int)projectedRate))
					.append(",")
					.append(String.valueOf(Math.round(projectedRuns)));
		}

		return result.toString();
	}
}