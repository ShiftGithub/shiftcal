$(document).ready( function() {
    var startDate = new Date(),
        container = $('#mustache-html');

    function displayCalendar(append) {
        var endDate = new Date();
        endDate.setDate(startDate.getDate() + 9);
        $.get( 'events.php?startdate=' + startDate.toISOString() + '&enddate=' + endDate.toISOString(), function( data ) {
            var groupedByDate = [];
            var mustacheData = { dates: [] };
            $.each(data.events, function( index, value ) {
                var date = formatDate(value.date);
                if (groupedByDate[date] === undefined) {
                    groupedByDate[date] = {
                        date: date,
                        events: []
                    };
                    mustacheData.dates.push(groupedByDate[date]);
                }
                var timeParts = value.time.split(':');
                var hour = parseInt(timeParts[0]);
                var meridian = 'AM';
                if ( hour === 0 ) {
                    hour = 12;
                } else if ( hour >= 12 ) {
                    meridian = 'PM';
                    if ( hour > 12 ) {
                        hour = hour - 12;
                    }
                }
                value.displayTime = hour + ':' + timeParts[1] + ' ' + meridian;
                value.mapLink = getMapLink(value.address);
                value.showEditButton = true; // TODO: permissions
                groupedByDate[date].events.push(value);
            });

            var compareEvents = function ( event1, event2 ) {
                if ( event1.time < event2.time ) {
                    return -1;
                }
                if ( event1.time > event2.time ) {
                    return 1;
                }
                return 0;
            };
            for ( var date in groupedByDate )  {
                groupedByDate[date].events.sort(compareEvents);
            }
            var template = $('#mustache-template').html();
            var info = Mustache.render(template, mustacheData);
            if (append) {
                $('#load-more').remove();
            } else {
                container.empty();
            }
            container.append(info);
        });
    }

    function getMapLink(address) {
        return 'http://maps.google.com/' +
            '?bounds=45.389771,-122.829208|45.659647,-122.404175&q=' +
            encodeURIComponent(address);
    }

    function displayEditForm( id , secret ) {
        if (id) {
            // TODO: loading spinner
            $.get( 'retrieve_event.php?id=' + id, function( data ) {
                data.secret = secret;
                data.readComic = true;
                populateEditForm( data );
            });
        } else {
            populateEditForm({ dates: [] });
        }
    }

    function populateEditForm( shiftEvent ) {
        var i, h, m, meridian,
            displayHour, displayMinute, timeChoice,
            template, rendered,
            lengths = [ '0-3', '3-8', '8-15', '15+' ];

        shiftEvent.lengthOptions = [];
        for ( i = 0; i < lengths.length; i++ ) {
            shiftEvent.lengthOptions.push({
                range: lengths[i]
            });
        }

        shiftEvent.timeOptions = [];
        meridian = 'AM';
        for ( h = 0; h < 24; h++ ) {
            for ( m = 0; m < 60; m += 15 ) {
                if ( h > 11 ) {
                    meridian = 'PM';
                }
                if ( h === 0 ) {
                    displayHour = 12;
                } else if ( h > 12 ) {
                    displayHour = h - 12;
                } else {
                    displayHour = h;
                }
                displayMinute = m;
                if ( displayMinute === 0 ) {
                    displayMinute = '00';
                }
                timeChoice = {
                    time: displayHour + ':' + displayMinute + ' ' + meridian,
                    value: h + ':' + displayMinute + ':00'
                };
                if (h < 10) {
                    timeChoice.value = '0' + timeChoice.value;
                }
                if (shiftEvent.time === timeChoice.value) {
                    timeChoice.isSelected = true;
                }
                shiftEvent.timeOptions.push(timeChoice);
            }
        }
        shiftEvent.timeOptions.push({ time: "11:59 PM" });

        template = $('#mustache-edit').html();
        rendered = Mustache.render(template, shiftEvent);
        container.empty().append(rendered);
        setupDatePicker(shiftEvent['dates'] || []);

        $('#edit-header').affix({
            offset: {
                top: 100
            }
        });
        if (shiftEvent.dates.length === 0) {
            $('#save-button').prop('disabled', true);
            $('#preview-button').prop('disabled', true);
        }
        $('#save-button').click(function() {
            var postVars,
                isNew = !shiftEvent.id;
            $('.form-group').removeClass('has-error');
            $('.help-block').remove();
            $('#save-result').removeClass('text-success').removeClass('text-danger').text('');
            postVars = eventFromForm();
            if (!isNew) {
                postVars['id'] = shiftEvent.id;
            }
            $.ajax({
                type: 'POST',
                url: 'manage_event.php',
                data: JSON.stringify(postVars),
                success: function(returnVal) {
                    var msg = isNew ? 'Event saved!' : 'Event updated!';
                    $('#save-result').addClass('text-success').text(msg);
                    shiftEvent.id = returnVal.id;
                    if (returnVal.secret) {
                        location.hash = '#editEvent/' + returnVal.id + '/' + returnVal.secret;
                    }
                },
                error: function(returnVal) {
                    var err = returnVal.responseJSON.error;
                    $('#save-result').addClass('text-danger').text(err.message);
                    $.each(err.fields, function(fieldName, message) {
                        $('input[name=' + fieldName + ']')
                            .closest('.form-group,.checkbox')
                            .addClass('has-error')
                            .append('<div class="help-block">' + message + '</div>');
                    });
                },
                dataType: 'json',
                contentType: 'application/json'
            });
        });

        $(document).on('click', '#preview-button', function(e) {
            previewEvent(shiftEvent);
        });
    }

    function eventFromForm() {
        var harvestedEvent = {};
        $('form').serializeArray().map(function (x) {
            harvestedEvent[x.name] = x.value;
        });
        harvestedEvent['dates'] = dateList();
        return harvestedEvent;
    }

    //
    function previewEvent(shiftEvent) {
        var previewEvent = {},
            mustacheData;
        $.extend(previewEvent, shiftEvent, eventFromForm());
        previewEvent.displayTime = previewEvent.time;
        previewEvent['length'] += ' miles';
        previewEvent['preview'] = true;
        previewEvent['mapLink'] = getMapLink(previewEvent['address']);
        $('#event-entry').hide();
        mustacheData = {dates: [{
            date: formatDate(previewEvent.dates[0]),
            events: [previewEvent]
        }]};
        $('#preview-button').hide();
        $('#preview-edit-button').show().on('click', function() {
            $('#event-entry').show();
            $('.date').remove();
            $('#preview-button').show();
            $('#preview-edit-button').hide();
        });
        var template = $('#mustache-template').html();
        var info = Mustache.render(template, mustacheData);
        container.append(info);
    }

    function formatDate(dateString) {
        var date = new Date(dateString);
        return date.toLocaleDateString(
            navigator.language,
            {
                weekday: 'long',
                month: 'long',
                day: 'numeric'
            }
        );
    }

    /* Date Picker JS */
    // Global state variables, initialized in setupDatePicker
    var $dateSelect,
        $loadLater,
        $loadEarlier,
        $monthTable,
        monthTemplate,
        earliestMonth,
        latestMonth,
        dateMap,
        today,
        selectedCount = 0;

    // Some constants used for generating html. The JOY of javascript stdlib
    var monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];
    var cellClases = ["color-jan", "color-feb", "color-mar", "color-apr", "color-may", "color-jun",
        "color-jul", "color-aug", "color-sep", "color-oct", "color-nov", "color-dec"];

    // dateList returns the currently selected list of (normalized) dates for consumption by manage_event.php
    function dateList() {
        var dates = [];
        for (var key in dateMap) {
            if (dateMap.hasOwnProperty(key) && dateMap[key]) {
                dates.push(key);
            }
        }
        return dates;
    }

    // setupDatePicker sets up the global variables and populates the date picker element
    function setupDatePicker(dates) {
        // Fill in global variables
        // Set up dateMap
        dateMap = {};
        for (var i=0; i<dates.length; i++) {
            dateMap[normalizeDate(dates[i])] = true;
            selectedCount++;
        }

        // Scrolling container for the table
        $dateSelect = $('#date-select');
        // Placeholder divs that trigger loading when visible
        $loadLater = $('#load-later');
        $loadEarlier = $('#load-earlier');
        // Table that contains months
        $monthTable = $("#month-table");

        monthTemplate = $('#mustache-select-month').html();

        // Tracks when today is for styling purposes
        today = new Date();
        // These track which month to add to the start/end
        earliestMonth = today;
        latestMonth = today;

        // Fill in the first month
        $monthTable.html(getMonthHTML(earliestMonth));
        // Scroll the table to the top of the first month
        $dateSelect.scrollTop(loadLaterTop());

        // Add a click handler for individual days
        $monthTable.click(function(ev) {
            var e = ev.target;
            if (e.hasAttribute('data-date')) {
                var $e = $(e),
                    date = $e.attr('data-date');

                dateMap[date] = !dateMap[date];
                if (dateMap[date]) {
                    selectedCount++;
                    $('#save-button').prop('disabled', false);
                    $('#preview-button').prop('disabled', false);
                } else {
                    selectedCount--;
                    if ( selectedCount === 0 ) {
                        $('#save-button').prop('disabled', true);
                        $('#preview-button').prop('disabled', true);
                    }
                }
                $e.toggleClass('selected', dateMap[date]);

                return false;
            }
            return true;
        });

        // Setup the month table scroll checks
        $dateSelect.scroll(checkBounds);
    }


    function isToday(date) {
        return (date.getDate() == today.getDate()
            && date.getMonth() == today.getMonth()
            && date.getFullYear() == today.getFullYear())
    }

    function normalizeDate(date) {
        var jsd = new Date(date);
        var day = jsd.getDate();
        var monthIndex = jsd.getMonth();
        var year = jsd.getFullYear();

        return year + '-' + (monthIndex+1) + '-' + day;
    }

    function isSelected(date) {
        return !!dateMap[normalizeDate(date)];
    }

    function makeWeekData(date) {
        // date is the first day in the week
        // [{ day - string to display
        //    classes - classes to display },...]
        var week = [];
        for (var i=0;i<7;i++) {
            var day = {};
            day['day'] = date.getDate();
            day['date'] = normalizeDate(date);
            day['classes'] = (isToday(date) ? "today" : "") + " " + (isSelected(date) ? "selected" : "") + " " + cellClases[date.getMonth()] + (date.getDay() % 2 == 0 ? "-odd" : "");
            week.push(day);

            date = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
        }
        return week;
    }

    function makeMonthData(date) {
        // date is a day in a month to add

        // weeks:
        //   monthTitle - left title, only in first week
        //   weeksInMonth - rows that the title spans
        //   days:
        //     day: title
        //     date: yyyy-m-d (normalized)
        //     selected: cell class if selected

        // Normalize date, ensuring first of month
        var firstOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
        // Find the first day of the week for the week the 1st falls on
        var firstDay = new Date(firstOfMonth.getFullYear(), firstOfMonth.getMonth(), -firstOfMonth.getDay()+1);

        var firstOfNextMonth = new Date(date.getFullYear(), date.getMonth()+1, 1);
        // Don't include the week next months 1st lands on
        var stopDay = new Date(firstOfNextMonth.getFullYear(), firstOfNextMonth.getMonth(), -firstOfNextMonth.getDay()+1);

        var weeks = [];
        for (var startOfWeek=firstDay;startOfWeek<stopDay;) {
            var week = {};
            week['days'] = makeWeekData(startOfWeek);
            weeks.push(week);

            startOfWeek = new Date(startOfWeek.getFullYear(), startOfWeek.getMonth(), startOfWeek.getDate() + 7);
        }
        weeks[0]['monthTitle'] = monthNames[firstOfMonth.getMonth()] + " " + firstOfMonth.getFullYear();
        weeks[0]['weeksInMonth'] = weeks.length;

        return {"weeks": weeks};
    }

    function getMonthHTML(date) {
        return Mustache.render(monthTemplate, makeMonthData(date));
    }

    function loadLaterTop() {
        return $loadLater.offset().top - $dateSelect.offset().top;
    }

    function loadEarlierBottom() {
        return ($loadEarlier.offset().top + $loadEarlier.prop('scrollHeight')) - $dateSelect.offset().top;
    }

    var checking = false;
    function checkBounds() {
        if (checking) {
            return;
        }
        var added = false;
        if (loadEarlierBottom() >= 0) {
            latestMonth = new Date(latestMonth.getFullYear(), latestMonth.getMonth()-1, 1);
            var preHeight = $monthTable.height();
            $monthTable.prepend(getMonthHTML(latestMonth));
            var heightChange = $monthTable.height() - preHeight;
            $dateSelect.scrollTop($dateSelect.scrollTop() + heightChange);
            added = true;
        }
        if (loadLaterTop() <= $dateSelect.height()) {
            earliestMonth = new Date(earliestMonth.getFullYear(), earliestMonth.getMonth()+1, 1);
            $monthTable.append(getMonthHTML(earliestMonth));
            added = true;
        }
        if (added) {
            checking = true;
            setTimeout(function() {
                checking = false;
                checkBounds();
            }, 10);
        }
    }
    /* /Date Picker JS */

    $(document).on('click', 'a#add-event-button', function(e) {
        displayEditForm();
    });

    $(document).on('click', 'a#view-events-button, #confirm-cancel', function(e) {
        location.hash = 'viewEvents';
        startDate = new Date();
        displayCalendar();
    });

    $(document).on('click', 'a.expandDetails', function(e) {
        e.preventDefault();
        return false;
    });

    $(document).on('click', 'button.edit', function(e) {
        var id = $(e.target).closest('div.event').data('event-id');
        displayEditForm(id);
    });

    $(document).on('click', '#load-more', function(e) {
        startDate.setDate(startDate.getDate() + 10);
        displayCalendar(true);
        return false;
    });

    if (/^#addEvent/.test(location.hash)) {
        displayEditForm();
    } else if (
        /^#editEvent/.test(location.hash) &&
        location.hash.indexOf('/') > 0
    ) {
        var locationHashParts = location.hash.split('/');
        displayEditForm(locationHashParts[1], locationHashParts[2]);
    } else {
        displayCalendar();
    }
});
