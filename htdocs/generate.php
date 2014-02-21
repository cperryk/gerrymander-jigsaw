<!DOCTYPE html
PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN"
"http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">

<?php

// This PHP is meant only to output static HTML that is then copy and pasted into a CMS. It is NOT meant to run live.

ini_set('display_errors', 'On');
error_reporting(E_ALL);

//$PATH = 'http://slate.com/features/2013/08/jigsaw/';
$PATH = '';
//$LIB_PATH = 'http://www.slate.com/features/2013/lib/';
$LIB_PATH = 'dependencies/';

//Get the vote data of each congressional district. This data appear on mouse over after each puzzle is solved.
include 'csvToJSON.php';
$d = csvToDictionary('Congressional District Election Data.csv');
$vote_data = array();
foreach($d as $row){
    $state = $row['State'];
    $district = $row['District'];
    if(!isset($vote_data[$state])){
        $vote_data[$state] = array();
    }
    $vote_data[$state][$district] = array('percr'=>round(100*$row['PERCR']),'percd'=>round(100*$row['PERCD']));
}

?>

<html>
    <head>
        <script type="text/javascript" src="<? echo $LIB_PATH?>/jquery-1.8.2.min.js"></script>
        <title>Jigsaw</title>
    </head>
    <body>

        <div id="test_wrapper" style="width:920px;margin-left:auto;margin-right:auto">

        <div id="test_block" style="width:100%;height:100px"></div>





        <!-- paste into RenderHTML-->
        <link rel="stylesheet" href="jigsaw.css"/>
        <script type="text/javascript" src="<? echo $LIB_PATH?>raphael-min.js"></script>

        <!-- For more information on $vote_data, see above -->
        <?='<script type="text/javascript">'?>
            //<![CDATA[
            var VOTE_DATA = <?php echo json_encode($vote_data) ?>
            //]]>
        <?='</script>'?>

        <!-- selected_cds.js contains all the path info on the congressional districts in the variable CDS so Raphael can draw them -->
        <script type="text/javascript" src="<? echo $PATH?>selected_cds.js"></script>

        <!-- The script for the game mechanics -->
        <script type="text/javascript" src="jigsaw.js"></script>

        <div id="interactive">
            <div id="blurbs">
                <span id="IA">
                    Districts in Iowa tend to be competitive <a href="http://www.timesunion.com/opinion/article/Gerrymandering-Not-in-Iowa-1336319.php" target="_blank">due to strong laws against gerrymandering</a>. By law, the nonpartisan state agency responsible for redistricting must draw districts that are square, rectangular, or hexagonal and match city and county boundaries as much as possible. The agency cannot consider voter registration records and previous election results in the process. In 2012, the state's four congressional seats were split evenly between the two parties, with no candidates winning more than 60 percent of the vote.
                </span>
                <span id="MD">
                    Although Republican U.S. House candidates won about one-third of the vote in Maryland in 2012, they grabbed only one of the eight seats because Democratic state legislators had packed conservative voters into the <span data-target="01" class="districtLink">1<sup>st</sup> District</span> and given the <span data-target="02" class="districtLink">2<sup>nd</sup> District</span>, <span data-target="03" class="districtLink">3<sup>rd</sup> District</span>, and <span data-target="07" class="districtLink">7<sup>th</sup> District</span> pieces of the Baltimore area to make them safely Democratic. The <span data-target="03" class="districtLink">3<sup>rd</sup> District</span> has been <a href="http://www.newrepublic.com/blog/plank/109938/welcome-americas-most-gerrymandered-district" target="_blank">described</a> as "a crazy quilt," "a blood spatter from a crime scene," and a "broken-winged pterodactyl, lying prostrate across the center of the state."
                </span>
                <span id="OH">
                    An Ohio State University political scientist <a href="http://www.thelantern.com/campus/professor-new-ohio-congressional-district-lines-are-grotesque-1.2630389#.UgFg_ivXgvY" target="_blank">said</a> Ohio's adopted plan was "the most grotesque partisan gerrymander that I, as a political scientist, had ever seen." Although Obama beat Romney by two points, Republicans took 12 of the state's 16 House seats because the Republican-controlled state legislature had <a href="http://www.bloomberg.com/news/2013-03-18/republicans-foil-what-most-u-s-wants-with-gerrymandering.html" target="_blank">packed</a> Democratic voters into the <span data-target="03" class="districtLink">3<sup>rd</sup> District</span>, <span data-target="09" class="districtLink">9<sup>th</sup> District</span> and <span data-target="13" class="districtLink">13<sup>th</sup> District</span>.
                </span>
                <span id="PA">
                    In what Real Clear Politics called the "<a href="http://www.realclearpolitics.com/articles/2011/12/14/in_pennsylvania_the_gerrymander_of_the_decade_112404.html" target="_blank">Gerrymander of the Decade</a>," Republican state legislators in Pennsylvania packed the <span data-target="01" class="districtLink">1<sup>st</sup> District</span>, <span data-target="02" class="districtLink">2<sup>nd</sup> District</span>, and <span data-target="14" class="districtLink">14<sup>th</sup> District</span> with Democratic voters while drawing other districts to protect Republican candidates. Although Obama won Pennsylvania by 5 points in 2012, Republicans won 13 of the state's 18 U.S. House seats. 
                </span>
                <span id="NC">
                    Although Democratic House candidates in North Carolina received a majority of the vote, Republican candidates won nine of the state's 13 House seats because the Republican-controlled state legislature had packed the <span data-target="01" class="districtLink">1<sup>st</sup> District</span>, <span data-target="04" class="districtLink">4<sup>th</sup> District</span>, and <span data-target="12"  class="districtLink">12<sup>th</sup> District</span> with Democratic voters. A geographic analysis <a href="https://s3.amazonaws.com/s3.azavea.com/com.redistrictingthenation/pdfs/Redistricting_The_Nation_Addendum.pdf" target="_blank">showed</a> that the <span class="districtLink" data-target="12">12<sup>th</sup> District</span> is the least compact congressional district in the country.
                </span>
                <span id="MI">
                    Obama carried Michigan by nine points. Even so, Democratic House candidates, who themselves received a majority of the vote, only won five of the state's 14 seats. That's because the Republican-controlled state legislature packed as many Detroit-area Democrats as they could into the <span data-target="13" class="districtLink">13<sup>th</sup> District</span> and <span data-target="14" class="districtLink">14<sup>th</sup> District</span>. Democratic candidates in those districts each won more than 80 percent of the vote.
                </span>
            </div>
            <div id="interactive_tooltip"></div>
            <div id="interactive_nav">
                <p class="interactive_nav_element" id="interactive_nav_location">
                    <span id="btn_back" class="interactive_nav_btn">
                        &#0171;
                    </span>
                    <span id="location_readout_here"></span>
                    <span id="btn_next" class="interactive_nav_btn">
                        &#0187;
                    </span>
                </p>
                <p class="interactive_nav_element" id="interactive_nav_title">
                    The Gerrymander Quiz
                </p>
                <p class="interactive_nav_element" id="interactive_nav_time">
                    Time on this Puzzle:
                    <span id="current_time_here">00:00</span>
                </p>
            </div>
            <div id="int_raphael_canvas_container">
                <div id="puzzle_begin" class="interactive_footer">
                    This is a tutorial puzzle, and your time will not count toward your total time. Click and drag each piece to its proper place. Shift and click to select multiple shapes. <!--[if IE]>For an optimal experience, use Chrome, Firefox, or Safari.<![endif]-->
                </div>
                <div id="puzzle_disclaimer" class="interactive_footer">
                    (To fit all congressional districts, the Upper Peninsula, which is part of the 1<sup>st</sup> District, is not shown here.)
                </div>
                <div id="puzzle_solved" class="interactive_footer">
                    <table id="you_solved_p">
                        <tr>
                            <td valign="middle" style="vertical-align:middle">
                                <span id="you_solved"></span>
                                <p id="you_solved_share_btns">
                                    <span class="btn_share" id="you_solved_facebook_share">Share on Facebook</span><span class="btn_share" id="you_solved_twitter_share">Share on Twitter</span>
                                </p>
                            </td>
                            <td valign="middle" style="vertical-align:middle">
                                <img id="puzzle_solved_btn_next" src="<? echo $PATH?>graphics/btn_next.png"/>
                            </td>
                        </tr>
                    </table>
                    <p id="puzzle_solved_blurb"></p>
                </div>
                <div id="int_raphael_canvas" onmousedown="event.preventDefault ? event.preventDefault() : event.returnValue = false">
                    <table id="quiz_end" cellpadding="0" cellspacing="0"><tr><td style="vertical-align:middle;height:700px">
                        <p id="game_over">Complete!</p>
                        <p id="you_scored">You completed the puzzles in <span id="final_score_here"></span>.</p>
                        <p id="average_score">Average <strong><em>Slate</em></strong> reader time: <span id="average_score_here">Loading...</span></p>
                        <p id="share_btns"><span id="share_btns_inner"><span class="btn_share" id="btn_fb_share">Share on Facebook</span> | <span class="btn_share" id="btn_tw_share">Share on Twitter</span></span></p>
                    </td></tr></table>
                </div>
            </div>
        </div>
        <p id="interactive_attribution">* Voting percentages in tooltips are the percentages of the total votes for Democratic and Republican candidates. Source: Clerk of the House of Representatives</p>       
    
    <!-- STOP PASTE -->





    </div><!-- test wrapper -->
    </body>
</html>