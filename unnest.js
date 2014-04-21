//* TITLE Unnest **//
//* VERSION 1.0 REV A **//
//* DESCRIPTION Flattens Tumblr's nested comments so you can read each poster's URL and comment in sequential order, as God intended. **//
//* DEVELOPER butts mcgee **//
//* FRAME false **//
//* BETA false **//

XKit.extensions.unnest = new Object({

	running: false,

	preferences: {
		"toggle": {
			text: "Use a button to toggle nesting on individual posts, rather than unnesting all posts automatically",
			default: false,
			value: false
		}
	},

	// Get posts
	posts: XKit.interface.get_posts(mine=true),

	// Initialize variable to cache original post content
	postContent: new Object(),

	run: function() {
		this.running = true;
		if (XKit.extensions.unnest.preferences.toggle.value) {
			// OK so toggle() is deprecated/removed.
			// So here's a thought.
			// Initialize a variable for a click counter (unique per button, not sure how??)
			// Check the value of the counter, if even unNest, if odd reNest, in either case increment the counter
		}
		else {
			XKit.post_listener.add("unnest", XKit.extensions.unnest.applyToAll);
			XKit.extensions.unnest.applyToAll();
			//XKit.extensions.unnest.destroy();
		};
	},

	destroy: function() {
		this.running = false;
		XKit.post_listener.remove("unnest");
		console.log("Hello from destroy()!");
		// Iterate over posts and reNest them
		$(XKit.extensions.unnest.posts).each( function (i, obj){
			XKit.extensions.unnest.reNest(obj);
		});
	},

	getInnerQuote: function($obj) {
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
		// If object has a direct blockquote child
		if ($blockKids.length != 0) {
			// Run function recursively on that child
			return XKit.extensions.unnest.getInnerQuote($blockKids);
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
	},

	unNest: function($obj) {
		// Define variable for object's innermost blockquote
		var $innerQuote = XKit.extensions.unnest.getInnerQuote($obj);
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
				$innerQuote = XKit.extensions.unnest.getInnerQuote($obj);
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
	},

	reNest: function($obj){
		// Get post info
		var origPostObject = XKit.interface.post($obj);
		// Get post's original content by looking it up by post id in the postContent object
		var thisPostContent = XKit.extensions.unnest.postContent[origPostObject.id];
		console.log("thisPostContent =");
		console.log(thisPostContent);
		// Remove post body
		$obj.find("div.post_body").remove();
		// Append original post body content
		$obj.find("div.post_container").append($(thisPostContent));
	},

	applyToAll: function(){
		// Iterate over posts
		$(XKit.extensions.unnest.posts).each( function (i, obj){
			// Get post info
			var origPostObject = XKit.interface.post(obj);
			console.log("origPostObject =");
			console.log(origPostObject);
			// Define variable as the post's descendant div.post_body
			var $thisDiv = $(obj).find("div.post_body");
			// Clone the post body div to the postContent object with its post id as a key.
			// This functions as a cache of the original post structure
			XKit.extensions.unnest.postContent[origPostObject.id] = $thisDiv.clone();
			console.log("postContent =");
			console.log(XKit.extensions.unnest.postContent);
			console.log("$thisDiv =");
			console.log($thisDiv);
			// Run unNest on the post body div
			XKit.extensions.unnest.unNest($thisDiv);
		});
	}
});