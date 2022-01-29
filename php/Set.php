<?php
class Set
{
    private array $a = [];

    public function __construct(array $a = [])
    {
        foreach($a as $k)
        {
            $this->add($k);
        }
    }

    public function add($key)
    {
        $this->a[$key] = true;
    }
    
    public function contains($e)
    {
        foreach(array_keys($this->a) as $k)
        {
            if($k == $e)
                return true;
        }
        return false;
    }

    public function copy()
    {
        $new = new Set($this->toArray());
    }

    public function diff(Set $set)
    {
        $new = new Set();
        foreach(array_keys($this->a) as $k)
        {
            if(!$set->contains($k))
                $new->add($k);
        }
        return $new;
    }

    public function intersect(Set $set) : Set
    {
        $new = new Set();
        foreach($this->toArray() as $k)
        {
            if($set->contains($k))
                $new->add($k);
        }
        return $new;
    }

    public function isEmpty()
    {
        return empty($this->a);
    }

    public function toArray()
    {
        return array_keys($this->a);
    }

    public function union(Set $set)
    {
        $new = new Set(array_merge($this->toArray(), $set->toArray()));
        foreach($this->toArray() as $k)
        {
            $new->add($k);
        }
        return $new;
    }

    public function xor(Set $set)
    {
        return ($this->union($set))->diff($this->intersect($set));
    }
}
?>