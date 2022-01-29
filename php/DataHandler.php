<?php
require_once('Set.php');
require_once('DataEntry.php');
require_once('DataFilter.php');
require_once('DataFilterResults.php');
class DataHandler
{
    private string $fileName;
    private string $fileType;
    private string $dir;
    private array $entries = array(); //string array with string keys
    private $allKeys = false;
    private Set $allTags;

    public function __construct(string $fileName, string $fileType = "json", string $dir = "data")
    {
        $this->fileName = $fileName;
        $this->fileType = $fileType;
        $this->dir = $dir;
        $this->allTags = new Set();
        $this->create("");
    }

    public function getEntry(string $key) : DataEntry|null
    {
        //var_dump($this->entries);
        
        //var_dump($key);
        $key = strtoupper($key);
        if($this->hasEntry($key))
            return $this->entries[$key];
        return null;
    }

    public function hasEntry(string $key) : bool
    {
        $key = strtoupper($key);
        return array_key_exists($key, $this->entries);
    }

    public function setEntry(string $key, DataEntry $entry) : bool
    {
        $key = strtoupper($key);
        if(is_null($entry))
            return $this->deleteEntry($key);
        $change = true;
        if($this->hasEntry($key))
            $change = strcasecmp(json_encode($entry), json_encode($this->entries[$key]));
        $this->entries[$key] = (new DataEntry())->fromObj($entry);
        if($change)
            $this->resetCache();
        return $change;
    }

    public function deleteEntry(string $key) : bool
    {
        $key = strtoupper($key);
        if($this->hasEntry($key))
        {
            unset($this->entries[$key]);
            $this->resetCache();
            return true;
        }
        return false;
    }

    public function createEntry(string $key) : bool
    {
        $key = strtoupper($key);
        if(!$this->hasEntry($key))
        {
            $this->setEntry($key, new DataEntry());
            return true;
        }
        return false;
    }

    public function searchQuery(string $q) : Set
    {
        if(is_null($q) || strlen($q) == 0)
            return $this->getAllKeys();
        $rks = new Set();

        $q2 = str_replace("/", "", str_replace("-", "", $q));

        foreach(array_keys($this->entries) as $k)
        {
            if(mb_stripos(str_replace("/", "", str_replace("-", "", $k)), $q2) !== false)
            {
                $rks->add($k);
            }
        }

        return $rks;
    }

    public function searchTags(DataFilter $filter) : Set
    {
        $t0t = $filter->t0(true);
        $t0f = $filter->t0(false);
        $t1t = $filter->t1(true);
        $t1f = $filter->t1(false);

        if($t0t->union($t0f)->union($t1t)->union($t1f)->isEmpty() /* || true */)
            return $this->getAllKeys();
        
        $rks = new Set();
        
        foreach(array_keys($this->entries) as $k)
        {
            $tst = new Set($this->getEntry($k)->tags);
            $tsf = $this->getAllTags()->diff($tst);

            if($t0t->diff($tst)->isEmpty() && $t1t->intersect($tst)->isEmpty() && $t0f->diff($tsf)->isEmpty() && $t1f->intersect($tsf)->isEmpty())
                $rks->add($k);
        }

        return $rks;
    }

    public function searchBools(DataFilter $filter) : Set
    {
        $b0t = $filter->b0(true);
        $b0f = $filter->b0(false);
        $b1t = $filter->b1(true);
        $b1f = $filter->b1(false);

        if($b0t->union($b0f)->union($b1t)->union($b1f)->isEmpty())
            return $this->getAllKeys();
        
        $rks = new Set();
        
        foreach(array_keys($this->entries) as $k)
        {
            $e = $this->getEntry($k);
            
            $bst = $e->allBools(true, $filter->proj);
            $bsf = $e->allBools(false, $filter->proj);

            if($b0t->diff($bst)->isEmpty() && $b1t->intersect($bst)->isEmpty() && $b0f->diff($bsf)->isEmpty() && $b1f->intersect($bsf)->isEmpty())
                $rks->add($k);
        }

        return $rks;
    }

    public function filter(DataFilter $filter) : DataFilterResults
    {
        $rks = $this->searchTags($filter)->intersect($this->searchBools($filter));
        $tst = $this->getAllTagsWithKey($rks);
        $tsf = $this->getAllTags()->diff($tst);

        $rks0 = $rks->intersect($this->searchQuery($filter->q));
        $rks1 = $rks->diff($rks0);
        return new DataFilterResults($this->sort($rks0), $this->sort($rks1), $tst, $tsf);
    }
    
    public function sort(Set $s) : array
    {
        $l = $s->toArray();
        sort($l);
        return $l;
    }
    
    public function getAllKeys() : Set
    {
        if($this->allKeys === false)
            $this->allKeys = new Set(array_keys($this->entries));
        return $this->allKeys;
    }

    public function getAllTags() : Set
    {
        if($this->allTags->isEmpty())
            $this->allTags = $this->getAllTagsWithKey($this->getAllKeys());
        return $this->allTags;
    }

    public function getAllTagsWithKey(Set $keys) : Set
    {
        $ts = new Set();
        foreach($keys->toArray() as $k)
        {
            if($this->getEntry($k) != null && $this->getEntry($k)->tags != null)
                $ts = $ts->union(new Set($this->getEntry($k)->tags));
        }
        return $ts;
    }

    private function create(string $suffix) : void
    {
        $this->createDir();
        if(!file_exists($this->filePath($suffix)))
        {
            fclose($this->openWriteOnly($suffix)); //the file is created upon opening
        }
    }
    
    private function createDir() : void
    {
        if(!is_dir($this->dir))
            mkdir($this->dir);
    }

    private function exists(string $suffix) : bool
    {
        return is_dir($this->dir) && file_exists($this->filePath($suffix));
    }

    private function openReadOnly(string $suffix = "") //file pointer resource / false
    {
        if(!$this->exists($suffix))
        {
            $this->create($suffix);
        }
        $f = fopen($this->filePath($suffix), "r");
        if($f === false)
        {
            die("Unable to open file (r)");
        }
        return $f;
    }
    private function openWriteOnly(string $suffix = "") //file pointer resource / false
    {
        if(!$this->exists($suffix))
        {
            $this->create($suffix);
        }
        $f = fopen($this->filePath($suffix), "w");
        if($f === false)
        {
            die("Unable to open file (r)");
        }
        return $f;
    }
    private function fileSize(string $suffix = "") : int
    {
        if(!$this->exists($suffix))
        {
            $this->create($suffix);
        }
        $f = filesize($this->filePath($suffix));
        if($f === false)
        {
            die("Unable to open file (filesize)");
        }
        return $f;
    }

    private function resetCache()
    {
        $this->allKeys = false;
    }
    
    public function read() : void
    {
        $this->resetCache();
        $file = $this->openReadOnly();
        $json = html_entity_decode(fread($file, $this->fileSize()));
        fclose($file);

        $this->entries = DataEntry::arrayFromObj(json_decode($json));
        if(is_null($this->entries))
        {
            $this->entries = [];
            $file2 = $this->openWriteOnly("_error");
            fwrite($file2, $json);
            fclose($file2);
        }
    }
    
    public function write() : void
    {
        $json = json_encode($this->entries);
        $file = $this->openWriteOnly();
        fwrite($file, $json);
        fclose($file);
    }

    private function filePath(string $suffix = "") : string
    {
        return $this->dir . "/" . $this->fileName . $suffix . "." . $this->fileType;
    }
}
?>