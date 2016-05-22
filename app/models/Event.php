<?php

class Event extends fActiveRecord {
    protected function configure() {
        global $IMAGEDIR;

        fORMFile::configureFileUploadColumn(
            $this,
            'image',
            $IMAGEDIR
        );
    }

    public function toArray($include_hidden=false) {
        /*
        id:
        title:
        (different table!) date:
        venue:
        address:
        organizer:
        email:
        details:
        length:
        */
        $details = array(
            'id' => $this->getId(),
            'title' => $this->getTitle(),
            'venue' => $this->getLocname(),
            'address' => $this->getAddress(),
            'organizer' => $this->getName(),
            'details' => $this->getDescr(),
            'time' => strval($this->getEventtime()),
            'hideemail' => $this->getHideemail(),
            'length' => NULL
            //'length' => $this->getLength(),
            'timedetails' => $this->getTimedetails(),
            'weburl' => $this->getWeburl(),
            'image' => $this->getImage(),
            'audience' => $this->getAudience(),
            //'printevent' => $this->getPrintevent(),
            'tinytitle' => $this->getTinytitle(),
            'printdescr' => $this->getPrintdescr(),
            //'printcontact' => $this->getPrintcontact()
        );

        if ($this->getHideemail() == 0 || $include_hidden) {
            $details['email'] = $this->getEmail();
        }
        else {
            $details['email'] = null;
        }

        return $details;
    }

    public static function fromArray($input) {
        $event = null;
        if (array_key_exists('id', $input)) {
            try {
                // get event by id
                $event = new Event($input['id']);
            } catch (fExpectedException $e) {}
        }
        if ($event == null) {
            $event = new Event();
            $event->generateSecret();
        }

        // These are marked as required
        $event->setTitle(get($input['title'], 'Title missing'));
        $event->setLocname(get($input['venue'], 'Venue missing'));
        $event->setAddress(get($input['address'], 'Address missing'));
        $event->setName(get($input['organizer'], 'Organizer missing'));
        $event->setEmail(get($input['email'], 'Email missing'));

        // These are optional
        $event->setHideemail(get($input['hideemail'], 0));
        $event->setDescr(get($input['details'], ''));
        $event->setEventtime(get($input['time'], ''));
        $event->setHighlight(0);
        $event->setTimedetails(get($input['timedetails'], ''));
        $event->setWeburl(get($input['weburl'], ''));
        $event->setImage(get($input['image'], ''));
        $event->setAudience(get($input['audience'], ''));
        $event->setTinytitle(get($input['tinytitle'], ''));
        $event->setPrintdescr(get($input['printdescr'], ''));
        //$event->setPrintcontact(get($input['printcontact'], ''));
        // Length
        return $event;
    }

    private function getDates() {
        $eventTimes = $this->buildEventTimes('id');
        $eventDates = [];
        foreach ($eventTimes as $eventTime) {
            $eventDates []= $eventTime->getFormattedDate();
        }
        return $eventDates;
    }

    public function toDetailArray($include_hidden=false) {
        // first get the data into an array
        $detailArray = $this->toArray($include_hidden);
        // add all times that exist, maybe none.
        $detailArray["dates"] = $this->getDates();
        // return potentially augmented array
        return $detailArray;
    }

    public function secretValid($secret) {
        return $this->getPassword() == $secret;
    }

    private function generateSecret() {
        $this->setPassword(md5(drupal_random_bytes(32)));
    }

    public function emailSecret() {
        global $PROTOCOL, $HOST, $PATH;
        $base = $PROTOCOL . $HOST . $PATH;
        mail($this->getEmail(), "Edit event", "$base#editEvent/" . $this->getId() . "/" .$this->getPassword());
    }
}
fORM::mapClassToTable('Event', 'calevent');
