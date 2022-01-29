<?php
require_once('php/DataHandler.php');
require_once('php/DataFilter.php');

$method = $_SERVER['REQUEST_METHOD'];
$request = explode("/", substr(@$_SERVER['PATH_INFO'], 1));

$dataFileName = "parts";

switch($method)
{
    case 'GET':
    {
        if(isset($_GET['bools']))
        {
            $bs = DataEntry::$bools;
            if(isset($_GET['proj']) )
            {
                $proj = (string)html_entity_decode($_GET['proj']);
                if(!empty($proj))
                    $bs = DataEntry::allBoolsAt($proj);
            }
            $json = json_encode($bs);
            if($json === false || $json === true || $json === "null")
                $json = "{}";
            echo $json;
        }
        else if(isset($_GET['tags']))
        {
            $dh = new DataHandler($dataFileName);
            $dh->read();
            $json = json_encode($dh->getAllTags()->toArray());
            if($json === false || $json === true || $json === "null")
                $json = "{}";
            echo $json;
        }
        else if(isset($_GET['key']))
        {
            $key = json_decode('"' . html_entity_decode($_GET['key']) . '"');

            //echo "getting....";

            $dh = new DataHandler($dataFileName);
            $dh->read();
            $json = json_encode($dh->getEntry($key));
            if($json === false || $json === true || $json === "null")
                $json = "{}";
            //var_dump($json);
            echo $json;
        }
        else if(isset($_GET['q']) || isset($_GET['t0']) || isset($_GET['t1']) || isset($_GET['b0']) || isset($_GET['b1']))
        {
            //var_dump($_GET['t0']);
            //var_dump($_GET['t1']);
            $filter = new DataFilter();
            if(isset($_GET['q']))
                $filter->q = json_decode('"' . html_entity_decode($_GET['q']) . '"');
            if(isset($_GET['t0']))
                $filter->t0 = (array)json_decode(html_entity_decode($_GET['t0']));
            if(isset($_GET['t1']))
                $filter->t1 = (array)json_decode(html_entity_decode($_GET['t1']));
            if(isset($_GET['b0']))
                $filter->b0 = (array)json_decode(html_entity_decode($_GET['b0']));
            if(isset($_GET['b1']))
                $filter->b1 = (array)json_decode(html_entity_decode($_GET['b1']));
            if(isset($_GET['c0']))
                $filter->c0 = (array)json_decode(html_entity_decode($_GET['c0']));
            if(isset($_GET['c1']))
                $filter->c1 = (array)json_decode(html_entity_decode($_GET['c1']));
            if(isset($_GET['proj']))
                $filter->proj = (string)html_entity_decode($_GET['proj']);

            $dh = new DataHandler($dataFileName);
            $dh->read();
            $json = json_encode($dh->filter($filter));
            if($json === false || $json === true || $json === "null")
                $json = "{}";
            //var_dump($filter);
            echo $json;
        }
        else
        {
            die("must specify key to lookup part: /url?key={key}, <br> one or more of following filter properties: /url?q={query}?t0={[(!)tag]}?t1={![(!)tag]}?b0={[(!)bool]}?b1={![(!)bool]}, <br> empty query for all: /url?q=\"\", <br> bools: /url?bools");
        }
        break;
    }
    case 'PUT':
    {
        /*parse_str(file_get_contents("php://input"), $_PUT);
    
        foreach ($_PUT as $key => $value)
        {
            unset($_PUT[$key]);
    
            $_PUT[str_replace('amp;', '', $key)] = $value;
        }
    
        $_REQUEST = array_merge($_REQUEST, $_PUT);*/
        if(isset($_REQUEST['key']) && isset($_REQUEST['val']))
        {
            $dh = new DataHandler($dataFileName);
            $dh->read();

            $key = (string)json_decode('"' . (string)html_entity_decode($_GET['key']) . '"');
            $val = (object)json_decode(html_entity_decode($_REQUEST['val']));

            $de = ($dh->hasEntry($key) ? $dh->getEntry($key) : new DataEntry())->fromObj($val);

            $missing = $de->missingProperties();
            if(count($missing) == 0)
            {
                $return = $dh->setEntry($key, $de);
                $dh->write();
                echo json_encode($return);
            }
            else
            {
                echo json_encode($missing);
            }
        }
        else
        {
            die("must specify key and val to set part: /url?key={key}&val={{values}}");
        }
        break;
    }
    case 'DELETE':
    {
        if(isset($_REQUEST['key']))
        {
            $dh = new DataHandler($dataFileName);
            $dh->read();

            $key = (string)json_decode('"' . (string)html_entity_decode($_GET['key']) . '"');

            $return = $dh->deleteEntry($key);
            $dh->write();
            echo json_encode($return);
        }
        else
        {
            die("must specify key to delete part: /url?key={key}");
        }
        break;
    }
    default:
    {
        //handle_error($request);  
        break;
    }
}
?>