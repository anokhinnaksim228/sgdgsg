<?php
header('Content-Type: application/json');


$reviewsDir = 'reviews_data';
if (!is_dir($reviewsDir)) {
    mkdir($reviewsDir, 0777, true);
}



function getReviewsFilePath($movieId) {
    global $reviewsDir;
    
    $safeMovieId = basename(strval($movieId));
    if (empty($safeMovieId) || !ctype_alnum(str_replace('_', '', $safeMovieId))) {
        error_log("Invalid movieId format: " . $movieId);
        return null;
    }
    return $reviewsDir . '/reviews_' . $safeMovieId . '.json';
}

function readReviews($filePath) {
    if (!file_exists($filePath)) {
        return [];
    }
    $jsonContent = file_get_contents($filePath);
    if ($jsonContent === false) {
        error_log("Failed to read reviews file: " . $filePath);
        return null;
    }
    $reviews = json_decode($jsonContent, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        error_log("Failed to decode JSON from file: " . $filePath . " Error: " . json_last_error_msg());
        
        return [];
    }
    return $reviews;
}

function writeReviews($filePath, $reviews) {
    $jsonData = json_encode($reviews, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    if ($jsonData === false) {
        error_log("Failed to encode reviews to JSON for file: " . $filePath . " Error: " . json_last_error_msg());
        return false; 
    }
    
    $fileHandle = fopen($filePath, 'c');
    if (!$fileHandle) {
         error_log("Failed to open file for writing: " . $filePath);
         return false;
    }

    if (flock($fileHandle, LOCK_EX)) {
        ftruncate($fileHandle, 0);
        fwrite($fileHandle, $jsonData);
        fflush($fileHandle);
        flock($fileHandle, LOCK_UN);
        fclose($fileHandle);
        return true;
    } else {
        error_log("Could not get lock for file: " . $filePath);
        fclose($fileHandle);
        return false;
    }
}



$method = $_SERVER['REQUEST_METHOD'];


if ($method === 'GET') {
    if (!isset($_GET['movieId']) || empty(trim($_GET['movieId']))) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'movieId parameter is required.']);
        exit;
    }

    $movieId = trim($_GET['movieId']);
    $filePath = getReviewsFilePath($movieId);

    if ($filePath === null) {
         http_response_code(400);
         echo json_encode(['status' => 'error', 'message' => 'Invalid movieId format.']);
         exit;
    }

    $reviews = readReviews($filePath);

    if ($reviews === null) {
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => 'Could not read reviews data.']);
        exit;
    }

    echo json_encode(['status' => 'success', 'reviews' => $reviews]);
    exit;
}


if ($method === 'POST') {
    
    $rawData = file_get_contents('php://input');
    $postData = json_decode($rawData, true);

    if (json_last_error() !== JSON_ERROR_NONE) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'Invalid JSON payload.']);
        exit;
    }


   
    if (!isset($postData['movieId']) || empty(trim($postData['movieId'])) ||
        !isset($postData['name']) || empty(trim($postData['name'])) ||
        !isset($postData['review']) || empty(trim($postData['review']))) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'Missing required fields (movieId, name, review).']);
        exit;
    }

    $movieId = trim($postData['movieId']);
    
    $name = htmlspecialchars(trim($postData['name']), ENT_QUOTES, 'UTF-8');
    $reviewText = htmlspecialchars(trim($postData['review']), ENT_QUOTES, 'UTF-8');

     $filePath = getReviewsFilePath($movieId);
     if ($filePath === null) {
         http_response_code(400); 
         echo json_encode(['status' => 'error', 'message' => 'Invalid movieId format.']);
         exit;
     }

    $reviews = readReviews($filePath);
    if ($reviews === null) {
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => 'Could not read existing reviews data before saving.']);
        exit;
    }

  
    $newReview = [
        'name' => $name,
        'text' => $reviewText,
        'timestamp' => date('c')
    ];
    $reviews[] = $newReview;

    
    if (writeReviews($filePath, $reviews)) {
        echo json_encode(['status' => 'success', 'message' => 'Review added successfully.']);
    } else {
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => 'Failed to save review.']);
    }
    exit;
}


http_response_code(405);
echo json_encode(['status' => 'error', 'message' => 'Method not allowed. Only GET and POST are supported.']);
exit;
?>