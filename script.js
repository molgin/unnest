

// Define post divs to match
var $post = $("div.post_body");

// Define function to find an object's innermost blockquote object
function getInnerQuote($obj) {
	// Define variable
	var $blockKids
	// If object has direct children that are blockquotes that are immediately after p tags that contain a colon and that have an a tag child that contains no spaces and whose href includes "tumblr.com"
	if ($obj.children("p:contains(':'):has(a[href*='tumblr.com']):not(:contains(' '))+blockquote").length > 0) {
		// Set variable to those children
		$blockKids = $obj.children("p:contains(':'):has(a[href*='tumblr.com']):not(:contains(' '))+blockquote");
	}
	else {
		// Set variable to the results of the same selection but testing for "/post/" instead of "tumblr.com" to catch users with custom domains. These children may not exist but that's intended.
		$blockKids = $obj.children("p:contains(':'):has(a[href*='/post/']):not(:contains(' '))+blockquote");
	};
	// Define variable as object's direct children that are blockquotes, as long as they have a previous adjacent p element that has an a element child of class .tumblr_blog
	// var $blockKids = $obj.children("p:contains(':'):has(a[href*='tumblr.com']):not(:contains(' '))+blockquote");
	// If object has a direct blockquote child
	if ($blockKids.length != 0) {
		// Run function recursively on that child
		return getInnerQuote($blockKids);
	}
	else {
		// If current object is a blockquote
		if ($obj.is("blockquote")) {
			// Return the innermost (childless) blockquote
			return $obj;
		}
		else {
			// Return null if the object had no blockquote children and is not a blockquote
			return null
		};
	};
};

// Define a function to un-nest the blockquotes and their attributions
function unNest($obj) {
	// Define variable for object's innermost blockquote
	var $innerQuote = getInnerQuote($obj);
	// Only make changes if there's actually an inner quote to move
	if ($innerQuote != null) {
		// Add a new div after the object
		$obj.after("<div> </div>");
		// Define variable for new div
		var $nextDiv = $obj.next("div");
		// While there are still blockquotes in the object
		while ($innerQuote != null) {
			// Define variable for innermost blockquote plus its attribution
			var $fullComment = $innerQuote.prev("p").add($innerQuote);
			// Remove full comment
			$fullComment.remove();
			// Add full comment to new div
			$nextDiv.append($fullComment);
			// Reset variable to new innermost blockquote
			$innerQuote = getInnerQuote($obj);
		};
		// If there's anything left in the object (new unattributed comments)
		if ($obj.children().length != 0) {
			// Stick them in a variable
			$newComment = $obj.children();
			// Remove them from the object
			$newComment.remove();
			// Add them to the new div
			$nextDiv.append($newComment);
		};
		// Put everything from the new div back in the original object
		$obj.append($nextDiv.children());
		// Get rid of the new div
		$nextDiv.remove();
	};
};

// Iterate over the matching divs and unnest them
$("button#unnest").click(function(){
	$post.each( function (i, obj){
		unNest($(this));
	});
});

// unNest($("div.copy"));

//NOTE TO SELF if dynamic variable names are too hard i could possibly store info in an object w/ post id as key??

