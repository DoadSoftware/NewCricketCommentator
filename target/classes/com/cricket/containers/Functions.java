package com.cricket.containers;

import java.io.File;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import com.cricket.model.DuckWorthLewis;
import com.cricket.model.Event;
import com.cricket.model.Inning;
import com.cricket.model.MatchAllData;
import com.cricket.util.CricketFunctions;
import com.cricket.util.CricketUtil;

public class Functions 
{
	public static String countDotBalls(int inn_num,List<Event> events) {
		int countBalls=0;
		if((events != null) && (events.size() > 0)) {
			for(Event evnt : events) {
				if(evnt.getEventInningNumber() == inn_num) {
					switch(evnt.getEventType()) {
					case CricketUtil.DOT:  case CricketUtil.BYE:  case CricketUtil.LEG_BYE:  case CricketUtil.LOG_WICKET:
						countBalls++;
						break;
					}
				}
			}
		}
		return String.valueOf(countBalls);
	}
	
	public static String getPowerPlayScore(Inning inning,int inn_num,List<Event> events) {
		int total_run_PP=0, total_wickets_PP=0;
		if((events != null) && (events.size() > 0)) {
			for(Event evnt : events) {
				if(evnt.getEventInningNumber() == inn_num) {
					int Event_overs = ((evnt.getEventOverNo()*6)+evnt.getEventBallNo());
					if((Event_overs) <= (Integer.valueOf(inning.getFirstPowerplayEndOver()) * 6)) {
						switch(evnt.getEventType()) {
						case CricketUtil.ONE : case CricketUtil.TWO: case CricketUtil.THREE:  case CricketUtil.FIVE : case CricketUtil.DOT:
						case CricketUtil.FOUR: case CricketUtil.SIX: 
							total_run_PP += evnt.getEventRuns();
							break;
			          
						case CricketUtil.WIDE: case CricketUtil.NO_BALL: case CricketUtil.BYE: case CricketUtil.LEG_BYE: case CricketUtil.PENALTY:
							total_run_PP += evnt.getEventRuns();
							break;
			        	
						case CricketUtil.LOG_WICKET:
							total_wickets_PP += 1;
							break;
			        
						case CricketUtil.LOG_ANY_BALL:
							total_run_PP += evnt.getEventRuns();
							if (evnt.getEventExtra() != null) {
								total_run_PP += evnt.getEventExtraRuns();
							}
							if (evnt.getEventSubExtra() != null) {
								total_run_PP += evnt.getEventSubExtraRuns();
							}
							if (evnt.getEventHowOut() != null && !evnt.getEventHowOut().isEmpty()) {
								total_wickets_PP += 1;
							}
							break;
						}
					}
				}
			}
		}
		return String.valueOf(total_run_PP)+"-"+String.valueOf(total_wickets_PP);
	}
	
	/* Tushar: "SCORE BY PHASES" table (fruit-board.js reads PHASE1/PHASE2/PHASE3
	   off each inning's stats map, for both the batting team's own inning AND
	   the opponent's inning). Mirrors the run/wicket counting switch already
	   used in getPowerPlayScore/compareInningData in the library, but bucketed
	   by OVER NUMBER (0-indexed) rather than a ball-position threshold.
	   Confirmed against CricketFunctions' own usage (e.g. the ball-by-ball text
	   builder does "over_number = eventOverNo + 1" for a legal delivery) that
	   Event.eventOverNo is the 0-indexed over the ball was bowled in — so overs
	   1-6 = eventOverNo 0-5, 7-15 = 6-14, 16-20 = 15-19 for a 20-over innings.
	   Returns "runs-wickets", same format as getPowerPlayScore, so the JS's
	   existing fb_safe(...,'-') degrade-to-dash behavior on an empty inning
	   keeps working. */
	public static String getPhaseScore(int inn_num, int startOverIdx, int endOverIdx, List<Event> events) {
		int total_run = 0, total_wickets = 0;
		if((events != null) && (events.size() > 0)) {
			for(Event evnt : events) {
				if(evnt.getEventInningNumber() == inn_num) {
					if(evnt.getEventOverNo() >= startOverIdx && evnt.getEventOverNo() <= endOverIdx) {
						switch(evnt.getEventType()) {
						case CricketUtil.ONE : case CricketUtil.TWO: case CricketUtil.THREE:  case CricketUtil.FIVE : case CricketUtil.DOT:
						case CricketUtil.FOUR: case CricketUtil.SIX: 
							total_run += evnt.getEventRuns();
							break;

						case CricketUtil.WIDE: case CricketUtil.NO_BALL: case CricketUtil.BYE: case CricketUtil.LEG_BYE: case CricketUtil.PENALTY:
							total_run += evnt.getEventRuns();
							break;

						case CricketUtil.LOG_WICKET:
							total_wickets += 1;
							break;

						case CricketUtil.LOG_ANY_BALL:
							total_run += evnt.getEventRuns();
							if (evnt.getEventExtra() != null) {
								total_run += evnt.getEventExtraRuns();
							}
							if (evnt.getEventSubExtra() != null) {
								total_run += evnt.getEventSubExtraRuns();
							}
							if (evnt.getEventHowOut() != null && !evnt.getEventHowOut().isEmpty()) {
								total_wickets += 1;
							}
							break;
						}
					}
				}
			}
		}
		return String.valueOf(total_run) + "-" + String.valueOf(total_wickets);
	}

	/* Tushar: null-safe count of reviews taken by a given team within one
	   inning's reviews list — used for the REVIEWS/OPP_REVIEWS stage-stats row. */
	public static int countReviewsForTeam(List<com.cricket.model.Review> reviews, int teamId) {
		int count = 0;
		if(reviews != null) {
			for(com.cricket.model.Review r : reviews) {
				if(r.getReviewTeamId() == teamId) { count++; }
			}
		}
		return count;
	}

	/* Tushar: finds the "other" inning object for a given inning — i.e. the
	   opponent's innings entry — by matching on a DIFFERENT battingTeamId.
	   Used to populate the OPP_* stat keys (fours/sixes/dots/reviews) that sit
	   alongside each inning's own TEAM_* keys, matching the pattern
	   fruit-board.js already uses client-side to find oppInning. Returns null
	   if the opponent hasn't started their innings yet (entry doesn't exist). */
	public static Inning findOpponentInning(MatchAllData match, Inning current) {
		if(match == null || match.getMatch() == null || match.getMatch().getInning() == null) { return null; }
		for(Inning candidate : match.getMatch().getInning()) {
			if(candidate.getBattingTeamId() != current.getBattingTeamId()) {
				return candidate;
			}
		}
		return null;
	}

//	public static List<String> projectedScore(MatchAllData match) {
//		List<String> proj_score = new ArrayList<String>();
//		String  PS_Curr="", PS_1 = "",PS_2 = "",PS_3 = "",RR_1 = "",RR_2 = "",RR_3 = "",CRR = "";
//		int Balls_val = 0, remaining_balls = 0,total_runs=0;
//		double value = 0;
//		
//		if(match.getSetup().getReducedOvers() != null && !match.getSetup().getReducedOvers().isEmpty()){
//			if(match.getSetup().getReducedOvers().contains(".")) {
//		    	Balls_val = Integer.valueOf(match.getSetup().getReducedOvers().split("\\.")[0]) * Integer.valueOf(match.getSetup().getBallsPerOver()) + 
//	    			Integer.valueOf(match.getSetup().getReducedOvers().split("\\.")[1]);
//			} else {
//		    	Balls_val = Integer.valueOf(match.getSetup().getReducedOvers()) * Integer.valueOf(match.getSetup().getBallsPerOver());
//			}
//		} else {
//			Balls_val = match.getSetup().getMaxOvers()* Integer.valueOf(match.getSetup().getBallsPerOver());
//		}
//		
//		remaining_balls = (Balls_val - (match.getMatch().getInning().get(0).getTotalOvers()* Integer.valueOf(match.getSetup().getBallsPerOver()) 
//			+ match.getMatch().getInning().get(0).getTotalBalls()));
//		
//		if(match.getSetup().getSpecialMatchRules() != null && !match.getSetup().getSpecialMatchRules().isEmpty() 
//				&& match.getSetup().getSpecialMatchRules().equalsIgnoreCase("ISPL")) {
//			if(match.getMatch().getInning().get(0).getSpecialRuns() != null && 
//					!match.getMatch().getInning().get(0).getSpecialRuns().isEmpty()) {
//				if(match.getMatch().getInning().get(0).getSpecialRuns().startsWith("+")) {
//					total_runs = (match.getMatch().getInning().get(0).getTotalRuns() + 
//							Integer.valueOf(match.getMatch().getInning().get(0).getSpecialRuns().replace("+", "")));
//				}else if(match.getMatch().getInning().get(0).getSpecialRuns().startsWith("-")) {
//					total_runs = (match.getMatch().getInning().get(0).getTotalRuns() - 
//							Integer.valueOf(match.getMatch().getInning().get(0).getSpecialRuns().replace("-", "")));
//				}
//			}else {
//				total_runs = match.getMatch().getInning().get(0).getTotalRuns();
//			}
//			
//			value = (remaining_balls * Double.valueOf(CricketFunctions.generateRunRate(total_runs, match.getMatch().getInning().get(0).getTotalOvers(), 
//					match.getMatch().getInning().get(0).getTotalBalls(), 2,match)));
//			value  = value/6;
//			PS_Curr = String.valueOf(Math.round(((value + total_runs))));
//			CRR = CricketFunctions.generateRunRate(total_runs, match.getMatch().getInning().get(0).getTotalOvers(), 
//					match.getMatch().getInning().get(0).getTotalBalls(), 2,match);
//		}else {
//			total_runs = match.getMatch().getInning().get(0).getTotalRuns();
//			
//			value = (remaining_balls * Double.valueOf(match.getMatch().getInning().get(0).getRunRate()));
//			value  = value/6;
//			
//			PS_Curr = String.valueOf(Math.round(((value + match.getMatch().getInning().get(0).getTotalRuns()))));
//			CRR = match.getMatch().getInning().get(0).getRunRate();
//		}
//		
//		proj_score.add(CRR);
//		proj_score.add(String.valueOf(PS_Curr));
//		
//		String[] arr = (CRR.split("\\."));
//	    double[] intArr= new double[2];
//	    intArr[0]=Integer.parseInt(arr[0]);
//	  
//		for(int i=2;i<=6;i=i+2) {
//			if(i==2) {
//				value = (remaining_balls * (intArr[0] + i));
//				value = value / 6;
//				PS_1 = String.valueOf(Math.round(value + total_runs));
//				RR_1 = String.valueOf(((int)intArr[0] + i));
//				
//				proj_score.add(RR_1);
//				proj_score.add(PS_1);
//			}
//			else if(i==4) {
//				value = (remaining_balls * (intArr[0] + i));
//				value = value / 6;
//				PS_2 = String.valueOf(Math.round(value + total_runs));
//				RR_2 = String.valueOf(((int)intArr[0] + i));
//				
//				proj_score.add(RR_2);
//				proj_score.add(PS_2);
//			}else if(i==6) {
//				value = (remaining_balls * (intArr[0] + i));
//				value = value / 6;
//				PS_3 = String.valueOf(Math.round(value + total_runs));
//				RR_3 = String.valueOf(((int)intArr[0] + i));
//				
//				proj_score.add(RR_3);
//				proj_score.add(PS_3);
//			}
//		}
//		return proj_score ;
//	}
	
	public static String ProjectedScore(MatchAllData match) {

	    String PS_1 = "", PS_2 = "", PS_3 = "", PS_Curr = "";
	    String RR1 = "", RR2 = "", RR3 = "", RR_Curr = "";

	    if(match == null
	            || match.getMatch() == null
	            || match.getMatch().getInning() == null
	            || match.getMatch().getInning().isEmpty()) {
	        return "";
	    }

	    Inning currentInning = null;

	    for(Inning inn : match.getMatch().getInning()) {
	        if(inn.getIsCurrentInning() != null
	                && inn.getIsCurrentInning().equalsIgnoreCase(CricketUtil.YES)) {
	            currentInning = inn;
	            break;
	        }
	    }

	    if(currentInning == null) {
	        currentInning = match.getMatch().getInning().get(0);
	    }

	    if(currentInning.getRunRate() == null
	            || currentInning.getRunRate().trim().isEmpty()) {
	        return "";
	    }

	    double currentRunRate;

	    try {
	        currentRunRate = Double.valueOf(currentInning.getRunRate());
	    } catch(Exception e) {
	        return "";
	    }

	    int ballsPerOver = 6;
	    try {
	        if(match.getSetup().getBallsPerOver() != null
	                && !match.getSetup().getBallsPerOver().isEmpty()) {
	            ballsPerOver = Integer.valueOf(match.getSetup().getBallsPerOver());
	        }
	    } catch(Exception e) {
	        ballsPerOver = 6;
	    }

	    int overVal;

	    if(match.getSetup().getTargetOvers() != null
	            && !match.getSetup().getTargetOvers().isEmpty()
	            && Double.valueOf(match.getSetup().getTargetOvers()) > 0) {

	        if(match.getSetup().getTargetOvers().contains(".")) {

	            overVal =
	                Integer.valueOf(match.getSetup().getTargetOvers().split("\\.")[0]) * ballsPerOver
	                + Integer.valueOf(match.getSetup().getTargetOvers().split("\\.")[1]);

	        } else {

	            overVal =
	                Integer.valueOf(match.getSetup().getTargetOvers()) * ballsPerOver;
	        }

	    } else {

	        overVal = match.getSetup().getMaxOvers() * ballsPerOver;
	    }

	    int ballsBowled =
	        (currentInning.getTotalOvers() * ballsPerOver)
	        + currentInning.getTotalBalls();

	    int remainingBalls = overVal - ballsBowled;

	    if(remainingBalls < 0) {
	        remainingBalls = 0;
	    }

	    double value =
	        (remainingBalls * currentRunRate) / ballsPerOver;

	    PS_Curr = String.valueOf(
	        Math.round(currentInning.getTotalRuns() + value)
	    );

	    RR_Curr = currentInning.getRunRate();

	    int baseRunRate = (int) Math.floor(currentRunRate);

	    for(int i = 2; i <= 6; i += 2) {

	        value =
	            (remainingBalls * (baseRunRate + i))
	            / (double) ballsPerOver;

	        String projectedScore =
	            String.valueOf(
	                Math.round(currentInning.getTotalRuns() + value)
	            );

	        if(i == 2) {
	            PS_1 = projectedScore;
	            RR1 = String.valueOf(baseRunRate + i);
	        }
	        else if(i == 4) {
	            PS_2 = projectedScore;
	            RR2 = String.valueOf(baseRunRate + i);
	        }
	        else if(i == 6) {
	            PS_3 = projectedScore;
	            RR3 = String.valueOf(baseRunRate + i);
	        }
	    }

	    return PS_Curr + "," + RR_Curr
	            + "," + PS_1 + "," + RR1
	            + "," + PS_2 + "," + RR2
	            + "," + PS_3 + "," + RR3;
	}
	public static String dls(MatchAllData match) {
		String balls="",data = ""; 
		Document htmlFile = null;
		if(new File("C:\\Sports\\ParScores BB.html").exists()) {
			try { 
				for(Inning inn : match.getMatch().getInning()) {
					if (inn.getIsCurrentInning().toUpperCase().equalsIgnoreCase(CricketUtil.YES)) {
						htmlFile = Jsoup.parse(new File("C:\\Sports\\ParScores BB.html"), "ISO-8859-1");
						balls = CricketFunctions.OverBalls(inn.getTotalOvers(), inn.getTotalBalls());
						
					}
				}
			} catch (IOException e) {  
				e.printStackTrace(); 
			} 
			
			List<DuckWorthLewis> this_dls = new ArrayList<DuckWorthLewis>();
			for(int i=14; i<htmlFile.body().getElementsByTag("font").size() - 1;i++) {
				if(htmlFile.body().getElementsByTag("font").get(i).text().contains("TableID")) {
					i = i + 15;
					if(i > htmlFile.body().getElementsByTag("font").size()) {
						break;
					}
				}
				
				for(Inning inn : match.getMatch().getInning()) {
					if (inn.getIsCurrentInning().toUpperCase().equalsIgnoreCase(CricketUtil.YES)) {
						//System.out.println(" i = " + (i+(1+(inn.getTotalWickets()))));
						this_dls.add(new DuckWorthLewis(htmlFile.body().getElementsByTag("font").get(i).text(),
								htmlFile.body().getElementsByTag("font").get(i+(2+(inn.getTotalWickets()))).text()));
					}
				}
				i = i +11;
				
			}
			for(int i = 0; i<= this_dls.size() -1;i++) {
				if(this_dls.get(i).getOver_left().equalsIgnoreCase(balls)) {
					data = this_dls.get(i).getWkts_down();
				}
			}
		}else {
			data = "";
		}
		
		return data;
	}
	@SuppressWarnings("unused")
	public static String populateDls(MatchAllData match) throws InterruptedException 
	{
		String team="",ahead_behind="";
		int runs = 0;
		
		String balls="",data = ""; 
		Document htmlFile = null; 
		if(new File("C:\\Sports\\ParScores BB.html").exists()) {
			try { 
				for(Inning inn : match.getMatch().getInning()) {
					if (inn.getIsCurrentInning().toUpperCase().equalsIgnoreCase(CricketUtil.YES)) {
						htmlFile = Jsoup.parse(new File("C:\\Sports\\ParScores BB.html"), "ISO-8859-1");
						balls = CricketFunctions.OverBalls(inn.getTotalOvers(), inn.getTotalBalls());
						
					}
				}
			} catch (IOException e) {  
				e.printStackTrace(); 
			} 
			
			List<DuckWorthLewis> this_dls = new ArrayList<DuckWorthLewis>();
			for(int i=14; i<htmlFile.body().getElementsByTag("font").size() - 1;i++) {
				if(htmlFile.body().getElementsByTag("font").get(i).text().contains("TableID")) {
					i = i + 15;
					if(i > htmlFile.body().getElementsByTag("font").size()) {
						break;
					}
				}
				
				for(Inning inn : match.getMatch().getInning()) {
					if (inn.getIsCurrentInning().toUpperCase().equalsIgnoreCase(CricketUtil.YES)) {
						//System.out.println(" i = " + (i+(1+(inn.getTotalWickets()))));
						this_dls.add(new DuckWorthLewis(htmlFile.body().getElementsByTag("font").get(i).text(),
								htmlFile.body().getElementsByTag("font").get(i+(2+(inn.getTotalWickets()))).text()));
					}
				}
				i = i +11;
				
			}
			for(int i = 0; i<= this_dls.size() -1;i++) {
				if(this_dls.get(i).getOver_left().equalsIgnoreCase(balls)) {
					data = this_dls.get(i).getWkts_down();
				}
			}
			
			for(Inning inn : match.getMatch().getInning()) {
				if (inn.getIsCurrentInning().toUpperCase().equalsIgnoreCase(CricketUtil.YES)) {
					if(inn.getBattingTeamId() == match.getSetup().getHomeTeamId()) {
						team = match.getSetup().getHomeTeam().getTeamName4();
					}
					if(inn.getBattingTeamId() == match.getSetup().getAwayTeamId()) {
						team = match.getSetup().getAwayTeam().getTeamName4();
					}
					
					for(int i = 0; i<= this_dls.size() -1;i++) {
						if(this_dls.get(i).getOver_left().equalsIgnoreCase(balls)) {
							runs = (inn.getTotalRuns() - Integer.valueOf(this_dls.get(i).getWkts_down()));
						}
					}
					if(runs < 0)
	                {
	                    ahead_behind = team + " ARE " + (Math.abs(runs)) + " RUNS BEHIND";
	                }

	                if (runs > 0)
	                {
	                    ahead_behind = team + " ARE " + runs + " RUNS AHEAD";
	                }
	                
	                if (runs == 0)
	                {
	                	ahead_behind = "DLS SCORE ARE LEVEL";
	                }
				}
			}
		}else {
			ahead_behind = "";
		}
		
		return ahead_behind;
	}
}
