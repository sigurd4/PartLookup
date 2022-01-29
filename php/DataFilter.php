<?php
require_once('Set.php');
class DataFilter
{
    //project name
    public string $proj = "";
    //required tags, prohibited tags
    public array $t0 = [];
    public array $t1 = [];
    public function t0(bool $i) : Set
    {
        $ts = new Set();
        if(!is_null($this->t0))
        {
            foreach($this->t0 as $t)
            {
                if((strcmp(substr($t, 0, 1), "!") !== 0) === $i)
                {
                    if(!$i)
                    {
                        $t = substr($t, 1);
                    }
                    if(strlen($t) > 0)
                        $ts->add($t);
                }
            }
        }
        return $ts;
    }
    public function t1(bool $i) : Set
    {
        $ts = new Set();
        if(!is_null($this->t1))
        {
            foreach($this->t1 as $t)
            {
                if((strcmp(substr($t, 0, 1), "!") !== 0) === $i)
                {
                    if(!$i)
                    {
                        $t = substr($t, 1);
                    }
                    if(strlen($t) > 0)
                        $ts->add($t);
                }
            }
        }
        return $ts;
    }
    //required boolean properties, prohibited boolean properties
    public array $b0 = [];
    public array $b1 = [];
    public function b0(bool $i) : Set
    {
        $bs = new Set();
        if(!is_null($this->b0))
        {
            foreach($this->b0 as $b)
            {
                if((strcmp(substr($b, 0, 1), "!") !== 0) === $i)
                {
                    if(!$i)
                    {
                        $t = substr($b, 1);
                    }
                    if(strlen($t) > 0)
                        $bs->add($t);
                }
            }
        }
        return $bs;
    }
    public function b1(bool $i) : Set
    {
        $bs = new Set();
        if(!is_null($this->b1))
        {
            foreach($this->b1 as $b)
            {
                if((strcmp(substr($b, 0, 1), "!") !== 0) === $i)
                {
                    if(!$i)
                    {
                        $b = substr($b, 1);
                    }
                    if(strlen($b) > 0)
                        $bs->add($b);
                }
            }
        }
        return $bs;
    }
    //search query
    public string $q = "";
    //part count
    public int $c0 = 0;
    public int $c1 = 0;
}
?>