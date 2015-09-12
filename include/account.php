<?php
	# Database access constants
	define("DBHOST", "localhost:8889");
	define("DBUSER", "root");
	define("DBPASSWORD", "root");
	define("DBDATABASE", "shift");

	# Directory where SHIFT's standard header and footer are stored
	define("INCLUDES", getcwd() . "/includes");

	# URL of the Directory where the calendar resides
	define("CALURL", "http://shiftcal.local:8888/");

	# The page to show when the user loads CALURL
	define("MAINPAGE", "view3week.php");

	# Timezone difference between the web host and Portland.
	define ("TZTWEAK", 0);

	# Email address for PP calendar crew.  This is used as the "From:"
	# address of confirmation messages.
	define("SHIFTEMAIL", "skirkendall@dsl-only.net");
?>
