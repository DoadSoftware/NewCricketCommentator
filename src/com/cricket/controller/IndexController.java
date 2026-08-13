package com.cricket.controller;
import java.io.BufferedReader;
import java.io.File;
import java.io.FileFilter;
import java.io.FileReader;
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
import com.cricket.model.MatchStats;
import com.cricket.model.MatchAllData;
import com.cricket.model.Player;
import com.cricket.model.Review;
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
	public static MatchStats MatchStats;
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
	@RequestMapping(value = {"/change_to_teams","change_to_ident","change_to_fruit"}, method={RequestMethod.GET,RequestMethod.POST})
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
	@RequestMapping(value = {"commentator"}, method={RequestMethod.GET,RequestMethod.POST})
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
		session_match = CricketFunctions.populateMatchVariables(CricketFunctions.readOrSaveMatchFile(CricketUtil.READ,
				CricketUtil.SETUP + "," + CricketUtil.MATCH + "," + CricketUtil.EVENT, session_match, false), session_players, 
				session_team, session_ground);
		session_match.getSetup().setMatchFileTimeStamp(new SimpleDateFormat("dd-MM-yyyy HH:mm:ss").format(new Date()));
		MatchStats = CricketFunctions.getAllEvents(session_match,"", session_match.getEventFile().getEvents());
		
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
	@RequestMapping(value = {"processCricketProcedures.html"}, method={RequestMethod.GET,RequestMethod.POST})
	public @ResponseBody String processCricketProcedures(
			@RequestParam(value = "whatToProcess", required = false, defaultValue = "") String whatToProcess,
			@RequestParam(value = "valueToProcess", required = false, defaultValue = "") String valueToProcess)
					throws Exception
	{
		switch (whatToProcess.toUpperCase()) {
		case "CHECK-NUMBER-INNINGS":
			session_match = CricketFunctions.populateMatchVariables(
				CricketFunctions.readOrSaveMatchFile(CricketUtil.READ,CricketUtil.SETUP + "," + CricketUtil.MATCH + ","
				+ CricketUtil.EVENT, session_match, false), session_players, session_team, session_ground);
			return objectMapper.writeValueAsString(session_match);
		case "READ-MATCH-AND-POPULATE":
			match_file_change = false;
			long currentMatchTimeStamp = new File(CricketUtil.CRICKET_DIRECTORY + CricketUtil.MATCHES_DIRECTORY
					+ session_match.getMatch().getMatchFileName()).lastModified();
			long currentEventTimeStamp = new File(CricketUtil.CRICKET_DIRECTORY+ CricketUtil.EVENT_DIRECTORY
					+ session_match.getMatch().getMatchFileName()).lastModified();
			if(last_match_time_stamp != currentMatchTimeStamp || last_event_time_stamp != currentEventTimeStamp) {
				session_match = CricketFunctions.populateMatchVariables(CricketFunctions.readOrSaveMatchFile(CricketUtil.READ,
								CricketUtil.SETUP + "," + CricketUtil.MATCH + "," + CricketUtil.EVENT,session_match,false),
								session_players, session_team, session_ground);
				MatchStats = CricketFunctions.getAllEvents(session_match,"", session_match.getEventFile().getEvents());
				match_file_change = true;
			}
			
			if(match_file_change == true) {
				last_match_time_stamp = new File(CricketUtil.CRICKET_DIRECTORY + CricketUtil.MATCHES_DIRECTORY
						+ session_match.getMatch().getMatchFileName()).lastModified();
				last_setup_time_stamp = new File(CricketUtil.CRICKET_DIRECTORY + CricketUtil.SETUP_DIRECTORY
						+ session_match.getMatch().getMatchFileName()).lastModified();
				last_event_time_stamp = new File(CricketUtil.CRICKET_DIRECTORY + CricketUtil.EVENT_DIRECTORY
						+ session_match.getMatch().getMatchFileName()).lastModified();
			}
			
			Review reviewRemaining = CricketFunctions.getReviewRemaining(session_match);
			
			for(Inning inn : session_match.getMatch().getInning()){
				Map<String, String> phaseStats = inn.getStats();
				if(phaseStats == null){
					phaseStats = new HashMap<String,String>();
				}
				String allInningPhaseWiseScore = CricketFunctions.getPhaseWiseScore(session_match,inn.getInningNumber(),session_match.getEventFile().getEvents()).split("\\|")[0]; 
				if(allInningPhaseWiseScore != null && !allInningPhaseWiseScore.trim().isEmpty()) {
					String[] allInningPhases = allInningPhaseWiseScore.split("_");
					if(allInningPhases.length > 0) {
						phaseStats.put("PHASE1", allInningPhases[0].replace(",", "-"));
					}
					if(allInningPhases.length > 1) {
						phaseStats.put("PHASE2", allInningPhases[1].replace(",", "-"));
					}
					if(allInningPhases.length > 2) {
						phaseStats.put("PHASE3", allInningPhases[2].replace(",", "-"));
					}
				} else {
					phaseStats.put("PHASE1", "-");
					phaseStats.put("PHASE2", "-");
					phaseStats.put("PHASE3", "-");
				}
				inn.setStats(phaseStats);
				if(inn.getIsCurrentInning().equalsIgnoreCase(CricketUtil.YES)) {
					Map<String, String> stats = inn.getStats();
					if(stats == null){
						stats = new HashMap<String,String>();
					}
					// Last-ball speed is an external/live XML value, so read it on every poll.
					try {
						File speedFile = new File(CricketUtil.CRICKET_DIRECTORY + CricketUtil.SPEED_DIRECTORY + "SPEED.txt");
						if(speedFile.exists()) {
							String text_to_return = "";
							int lineIndex1 = 1;
							boolean found1 = false;
							BufferedReader br = new BufferedReader(new FileReader(speedFile));

							while ((text_to_return = br.readLine()) != null) {
								if (lineIndex1 == 1) {
									stats.put("SPEED", text_to_return);
									found1 = true;
									break;
								}
								lineIndex1++;
							}
							if (!found1) {
								// System.out.println("Line Not There");
							}
						}
					} catch(Exception ex) {
						System.out.println("Unable to read last ball speed: " + ex.getMessage());
					}
					
					stats.put(CricketUtil.OVER + inn.getInningNumber(), CricketFunctions.OverBalls(inn.getTotalOvers(), inn.getTotalBalls()));
					if(inn.getRunRate() != null && !inn.getRunRate().trim().isEmpty()) {
					    try {
					        stats.put("PS", String.join(",", CricketFunctions.projectedScore(session_match)));
					    } catch (Exception ex) {
					        System.out.println("Unable to calculate projected score: " + ex.getMessage());
					    }
					}
						
					for(BattingCard bc : inn.getBattingCard()) {
						if(bc.getStatus().equalsIgnoreCase(CricketUtil.NOT_OUT) && bc.getOnStrike().equalsIgnoreCase(CricketUtil.YES)) {
							stats.put("BATSMAN1DOTS",  CricketFunctions.getScoreTypeData(CricketUtil.BATSMAN,session_match, inn.getInningNumber(), bc.getPlayerId(),",",
									session_match.getEventFile().getEvents()));
						}
						if(bc.getStatus().equalsIgnoreCase(CricketUtil.NOT_OUT) && bc.getOnStrike().equalsIgnoreCase(CricketUtil.NO)) {
							stats.put("BATSMAN2DOTS",  CricketFunctions.getScoreTypeData(CricketUtil.BATSMAN,session_match, inn.getInningNumber(), bc.getPlayerId(),",",
									session_match.getEventFile().getEvents()));
						}
						if(inn.getFallsOfWickets() != null) {
							if(inn.getFallsOfWickets().size() >=0) {
								if(inn.getFallsOfWickets().get(inn.getFallsOfWickets().size() -1).getFowPlayerID() == bc.getPlayerId()) {
									stats.put("BATSMAN_OUT",  CricketFunctions.getScoreTypeData(CricketUtil.BATSMAN,session_match, inn.getInningNumber(), bc.getPlayerId(),",",
											session_match.getEventFile().getEvents()));
								}
							}
						}
					}
					//stats.put(CricketUtil.BOUNDARY, CricketFunctions.lastFewOversData(CricketUtil.BOUNDARY, session_match.getEventFile().getEvents(),inn.getInningNumber()));
					//stats.put(CricketUtil.PLURAL,CricketFunctions.Plural(inn.getTotalOvers()));
					//stats.put("DLS", Functions.dls(session_match));
					//stats.put("DLS_EQUATION", Functions.populateDls(session_match));
					stats.put("PREVIOUS_BOWLER", CricketFunctions.previousBowler(session_match, session_match.getEventFile().getEvents()));
					stats.put("OTHER_BOWLER", CricketFunctions.otherBowler(session_match, session_match.getEventFile().getEvents()));
					stats.put(CricketUtil.POWERPLAY, CricketFunctions.processPowerPlay(CricketUtil.MINI,session_match));
					stats.put(CricketUtil.BOUNDARY, String.valueOf(MatchStats.getBallsSinceLastBoundary()));
					stats.put(CricketUtil.TOSS, CricketFunctions.generateTossResult(session_match,CricketUtil.SHORT, "", CricketUtil.SHORT, ""));
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
						int ballsBowled = (inn.getTotalOvers() * 6) + inn.getTotalBalls();
						int lastBallsCount = ballsBowled < 30 ? ballsBowled : 30;
						String[] last30Parts = CricketFunctions.getlastthirtyballsdata(session_match, ",", session_match.getEventFile().getEvents(), lastBallsCount).split(",");
						int last30Runs = Integer.parseInt(last30Parts[0]);
						int last30Wickets = Integer.parseInt(last30Parts[1]);
						String last30Text = "LAST " + lastBallsCount + " BALLS: " + last30Runs + " RUN" + CricketFunctions.Plural(last30Runs)
							+ " & " + last30Wickets + " WICKET" + CricketFunctions.Plural(last30Wickets);
						stats.put("LAST_30_BALLS", last30Text);
					}
				}
			
			Map<String, String> stats = inn.getStats();
			if(stats == null){
				stats = new HashMap<String,String>();
			}

			stats.put("TEAM_FOURS", String.valueOf(inn.getTotalFours()));
			stats.put("TEAM_SIXES", String.valueOf(inn.getTotalSixes()));
			stats.put("TEAM_DOTS", String.valueOf(Functions.countDotBalls(inn.getInningNumber(), session_match.getEventFile().getEvents())));
			if(inn.getBattingTeamId() == session_match.getSetup().getHomeTeamId()) {
				stats.put("REVIEWS", reviewRemaining.getReviewStatus().split(",")[0]);
			}else if(inn.getBattingTeamId() == session_match.getSetup().getAwayTeamId()) {
				stats.put("REVIEWS", reviewRemaining.getReviewStatus().split(",")[1]);
			}
			
			if(inn.getInningNumber() == 1){
				stats.put("TEAM_ATSTAGE",inn.getTotalRuns() + "-" + inn.getTotalWickets());
			} else if(inn.getInningNumber() == 2){
				stats.put("TEAM_ATSTAGE",inn.getTotalRuns() + "-" + inn.getTotalWickets());
				if(inn.getIsCurrentInning().equalsIgnoreCase(CricketUtil.YES)){
					String opponentAtStage = CricketFunctions.compareInningData(session_match,"-",1,session_match.getEventFile().getEvents());
					if(opponentAtStage != null && !opponentAtStage.trim().isEmpty()){
						stats.put("OPP_ATSTAGE", opponentAtStage);
					} else {
						stats.put("OPP_ATSTAGE", "-");
					}
				} else {
					stats.put("OPP_ATSTAGE", "-");
				}
				
				stats.put("EQUATION", CricketFunctions.GenerateMatchSummaryStatus(2, session_match, CricketUtil.FULL, 
						"", "", false).getTargetOrResult().toUpperCase());
			}

			Inning oppInningForStage = Functions.findOpponentInning(session_match,inn);

			if(oppInningForStage != null){
				stats.put("OPP_FOURS",String.valueOf(oppInningForStage.getTotalFours()));
				stats.put("OPP_SIXES",String.valueOf(oppInningForStage.getTotalSixes()));
				stats.put("OPP_DOTS",String.valueOf(oppInningForStage.getDots()));
				stats.put( "OPP_REVIEWS",String.valueOf(Functions.countReviewsForTeam(oppInningForStage.getReviews(),oppInningForStage.getBattingTeamId())));
			}

			inn.setStats(stats);

			}			
			return objectMapper.writeValueAsString(session_match);
		default:
			return objectMapper.writeValueAsString(session_match);
		}
	}
}