<?php 
	
$file="json/airports.csv";
$csv= file_get_contents($file);
$array = array_map("str_getcsv", explode("\n", $csv));

$json = '{"type":"FeatureCollection","features":[';
foreach ($array as $airport){ 
/*
	echo "BEGIN AIRPORT<pre>";
	print_r($airport);
	echo "</pre></hr>";
*/
		
	$json .='{"type":"Feature",
"properties":
	{"abbrev":"'.$airport[0].'"},
"geometry":
	{"type":"Point","coordinates":['.$airport[5].','.$airport[6].']}},';

	
}
$json .= "]}";
 echo $json;


?>