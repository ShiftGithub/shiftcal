<?php

class EventTime extends fActiveRecord {
    public static function getByID($id) {
        return fRecordSet::build(
            'EventTime', // class
            array(
                'pkid=' => $id
            )
        );
    }

    public static function getRangeVisible($firstDay, $lastDay) {
        return fRecordSet::build(
            'EventTime', // class
            array(
                'eventdate>=' => $firstDay,
                'eventdate<=' => $lastDay,
                'calevent{id}.hidden!' => 1,
                'eventstatus!' => 'S',
                'calevent{id}.review!' => 'E' // 'E'xcluded
            ), // where
            array('eventdate' => 'asc')  // order by
        );
    }

    public function updateStatus($dateStatus) {
        if ($this->getEventstatus() !== $dateStatus['status']) {
            // EventTime status is different than the request, update EventTime db entry
            $this->setEventstatus($dateStatus['status']);
        }
        if ($this->getNewsflash() !== $dateStatus['newsflash']) {
            // EventTime newsflash is different than the request, update EventTime db entry
            $this->setNewsflash($dateStatus['newsflash']);
        }
        $this->store();
    }

    private function getEvent() {
        try {
            if ($this->getEventstatus() === 'E') {
                return $this->createEvent('exceptionid');
            }
            return $this->createEvent('id');
        }
        catch (fNotFoundException $e) {
            return new Event();
        }
    }

    private function getEndTime($starttime, $duration) {
        if ($duration == null) {
            return null;
        }
        $endtime = new DateTime($starttime);
        $endtime->modify("+{$duration} minutes");
        return $endtime->format('H:i:s');
    }

    public function getFormattedDate() {
        return $this->getEventdate()->format('Y-m-d');
    }

    public function getFormattedDateStatus() {
        $dateObject = array();
        $dateObject['id'] = $this->getPkid(); // Get ID for this EventTime
        $dateObject['date'] = $this->getFormattedDate(); // Get pretty date
        $dateObject['status'] = $this->getEventstatus(); 
        $dateObject['newsflash'] = $this->getNewsflash();
        return $dateObject;
    }

    protected function getShareable() {
        global $PROTOCOL, $HOST, $PATH;
        $base = trim($PROTOCOL . $HOST . $PATH, '/');

        $caldaily_id = $this->getPkid();
        return "$base/event-" . $caldaily_id;
    }

    public function toEventSummaryArray() {
        $eventArray = $this->getEvent()->toArray();
        $eventArray['date'] = $this->getFormattedDate();
        $eventArray['caldaily_id'] = $this->getPkid();
        $eventArray['shareable'] = $this->getShareable();
        $eventArray['cancelled'] = $this->getEventstatus() == 'C';
        $eventArray['newsflash'] = $this->getNewsflash();
        $eventArray['endtime'] = $this->getEndTime($eventArray['time'], $eventArray['eventduration']);

        return $eventArray;
    }
}

fORM::mapClassToTable('EventTime', 'caldaily');
