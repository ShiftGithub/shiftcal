<?php
	# This view generates an RSS feed ("Really Simple Syndication")
	# listing the calendar events for today and tomorrow.  Each event
	# has a link to its description in the "view3week.php" view, where
	# users can read the event's full description.

	include("include/common.php");
	header("Content-type: text/json");
	header("Cache-control: private");
  
	# Compute $today and $tomorrow.  This is slightly complicated by the
	# fact that Thinkhost uses the Eastern timezone, not Pacific.

  # connect to the database
	$conn = mysql_connect(DBHOST, DBUSER, DBPASSWORD) or die(mysql_error());
	mysql_select_db(DBDATABASE, $conn);

	function datelink($sqldate) {
		if ($sqldate >= PPSTART && $sqldate <= PPEND)
			$view = PPURL;
		else
			$view = "view3week.php";
		$date = strtotime($sqldate);
		return CALURL."$view#".date("Fj", $date);
	}

	function eventlink($sqldate, $id) {
		if ($sqldate >= PPSTART && $sqldate <= PPEND)
			$view = PPURL;
		else
			$view = "view3week.php";
		return CALURL."$view#".substr($sqldate, 8, 2)."-$id";
	}

	function pubdate($sqldate) {
		$date = strtotime($sqldate);
		return date("D, d M Y", $date)." 00:00:00 GMT";
	}

	# Generate the HTML for all entries in a given day, in the tiny format
	# used in the weekly grid near the top of the page.
  
	$start_date = date("Y-m-d", time() - 3600 * TZTWEAK);
  $days_ahead = 14;
  $end_date = date("Y-m-d", time() + 3600 * (24 * $days_ahead - TZTWEAK));
  
  
	$result = mysql_query("SELECT calevent.id as id, newsflash, tinytitle, eventdate, eventtime, timedetails, locname, address, locdetails, printdescr FROM calevent, caldaily WHERE caldaily.id = calevent.id AND eventdate >= \"${start_date}\" AND eventdate <= \"${end_date}\" AND eventstatus != \"C\" AND eventstatus != \"E\" AND eventstatus != \"S\" ORDER BY eventdate,eventtime", $conn) or die(mysql_error());

  $events = array();
  
  while ($event = mysql_fetch_object($result)) {
      $events[] = $event;
  }

  echo json_encode($events);  
  
  