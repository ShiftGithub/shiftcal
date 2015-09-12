t# shiftcal

This is the source code for the Shift calendar.
===============================================

It has been sanitized of passwords from the copy running at http://shift2bikes.org/cal , but if you'd like to see it in action that's where to check it out.

Basic Architecture
------------------

You should write this!

How to setup & run locally
--------------------------

Minimally you'll need to do the following:

- be running PHP <5.7 >=5.4
- enable PHP and the mysql module (deprecated in PHP 5.5 but still works)
- checkout the source code and stick it in your document root, in a directory called shiftcal
- adjust the database settings in include/accout.php
- untar includes.tgz in your document root
- run mysql < init.sql to create an empty database
- profit! (aka load http://localhost/shiftcal)


How to propose changes
----------------------

Please fork the code, make a pull request, and we'll try to merge it!
