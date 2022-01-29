<?php
require_once('Set.php');
class DataFilterResults
{
    public array $res0 = [];
    public array $res1 = [];
    public array $tt = [];
    public array $tf = [];

    public function __construct(array $res0, array $res1, Set $tt, Set $tf)
    {
        $this->res0 = $res0;
        $this->res1 = $res1;
        $this->tt = $tt->toArray();
        $this->tf = $tf->toArray();
    }
}
?>