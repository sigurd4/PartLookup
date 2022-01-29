<?php
require_once('Set.php');
class DataEntry
{
    public array $tags = [];

    public function __construct()
    {
    }

    public static array $bools = ["have", "want", "used", "spotted", "lookedup"];
    public static array $projBools = ["used", "spotted", "tried"];

    public function bools(bool $val) : Set
    {
        $bs = new Set();
        foreach(DataEntry::$bools as $bool)
        {
            if($this->{$bool} === $val)
                $bs->add($bool);
        }
        return $bs;
    }
    
    public function projBools(bool $val, string $proj) : Set
    {
        if(empty($proj))
            return new Set();
        if(str_contains($proj, "@"))
            die("Illegal symbol '@' in project name \"" . $proj . "\".");
        $bs = new Set();
        foreach(DataEntry::$projBools as $projBool)
        {
            $b = DataEntry::projBoolAt($projBool, $proj);
            if((property_exists($this, $b) && $this->{$b}) === $val)
                $bs->add($b);
        }
        return $bs;
    }

    public function allBools(bool $val, string $proj) : Set
    {
        $bs = $this->bools($val);
        if(!empty($proj))
            $bs = $bs->union($this->projBools($val, $proj));
        return $bs;
    }

    public function setProjBool(string $projBool, bool $val, string $proj) : bool
    {
        if(empty($proj))
            return false;
        if(str_contains($proj, "@"))
            die("Illegal symbol '@' in project name \"" . $proj . "\".");
        if(!in_array($projBool, $this->projBools))
            die("Illegal project-bool \"" . $projBool . "\" not a legal value. Legal values are: [" . join("", $this->projBools) . "].");
        $pbn = DataEntry::projBoolAt($projBool, $proj);
        if(in_array($pbn, $this->bools))
            die("Illegal project-bool + project combination \"" . $pbn . "\" cannot match the name of global bool property \"" . $pbn . "\"");
        $this->{$pbn} = $val;
        
        return true;
    }

    public function fromObj($obj) : DataEntry
    {
        $e = clone $this;
        foreach($obj as $bool => $b)
        {
            if(!isset($b) || $bool === "tags")
                continue;
            if(!in_array($bool, DataEntry::$bools))
            {
                $pb = strtok($bool, "@");
                if(!in_array($pb, DataEntry::$projBools))
                    continue;
            }
            if(gettype($b) === "boolean" || gettype($b) === "integer")
                $e->{$bool} = (bool)$b;
        }
        
        if(isset($obj->tags))
        {
            $t = $obj->tags;
            if(isset($t) && gettype($t) === "array")
            {
                $e->tags = (array)$t;
                sort($e->tags);
            }
        }
        
        return $e;
    }

    public function missingProperties()
    {
        $a = [];
        foreach(DataEntry::$bools as $bool)
        {
            if(!isset($this->{$bool}))
                array_push($a, $bool);
        }
        
        if(!isset($this->tags))
            array_push($a, "tags");
        return $a;
    }

    public static function arrayFromObj($obja) : array
    {
        $a = array();
        foreach($obja as $k => $v)
        {
            $a[$k] = (new DataEntry())->fromObj($v);
        }
        return $a;
    }

    public static function projBoolsAt(string $proj) : array
    {
        if(empty($proj))
            return [];
        $bs = [];
        foreach(DataEntry::$projBools as $projBool)
        {
            array_push($bs, DataEntry::projBoolAt($projBool, $proj));
        }
        return $bs;
    }

    public static function projBoolAt(string $bool, string $proj) : string
    {
        if(!empty($proj))
            return $bool . "@" . $proj;
        echo "WARNING: Cannot generate name for project-bool " . $bool . " with empty project ID.";
        return "";
    }

    public static function allBoolsAt(string $proj) : array
    {
        if(empty($proj))
            return DataEntry::$bools;
        return array_merge(DataEntry::$bools, DataEntry::projBoolsAt($proj));
    }
}

//$de = new DataEntry();
//$de = json_decode("{\"tags\":[],\"have\":false,\"want\":true,\"used\":false,\"spotted\":false,\"lookedup\":false}");
//echo json_encode($de);
?>