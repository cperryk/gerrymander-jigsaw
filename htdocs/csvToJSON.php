<?php
function csvToDictionary($fileName,$keyColumn=null){
    echo $keyColumn;
    $array = array();
    $handle = @fopen($fileName, "r");
    if ($handle) {
        $rowCount = 0;
        $headers = array();
        while (($row = fgetcsv($handle, 4096)) !== false) {
            if($rowCount==0){
                foreach($row as $cell){
                    array_push($headers,$cell);
                }
            }
            else{
                $cellCount=0;
                $miniArray = array();
                foreach($row as $cell){
                    $miniArray[$headers[$cellCount]] = $cell;
                    $cellCount ++;
                }
                if(isset($keyColumn)){
					$array[$miniArray[$keyColumn]] = $miniArray;
                }
                else{
					array_push($array,$miniArray);
                }
            }
            $rowCount++;
        }
        if (!feof($handle)) {
            echo "Error: unexpected fgets() fail\n";
        }
        fclose($handle);
    }
    return $array;
}

?>
