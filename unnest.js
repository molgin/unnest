//* TITLE UnNest **//
//* VERSION 1.0 REV A **//
//* DESCRIPTION Flattens Tumblr's nested comments so you can read each poster's URL and comment in sequential order, as God intended. **//
//* DEVELOPER molgin **//
//* FRAME false **//
//* BETA true **//

XKit.extensions.unnest = new Object({

	running: false,

	preferences: {
		"toggle": {
			text: "Use a button to toggle nesting on individual posts, rather than unnesting all posts automatically.",
			default: false,
			value: false
		},

		"chron": {
			text: "Unnest comments in the strict chronological order in which they were added, rather than preserving their original top-to-bottom order. (Useful info such as content warnings and image descriptions may appear farther down in the post than originally intended.)",
			default: false,
			value: false
		}
	},

	// Get posts
	posts: XKit.interface.get_posts(mine=true),

	// Initialize variable to cache original post content
	postContent: new Object(),

	// This is what executes when the extension runs!
	run: function() {
		this.running = true;
		// If toggle option is selected
		if (XKit.extensions.unnest.preferences.toggle.value) {
			// Create button and specify what it should do when clicked
			XKit.interface.create_control_button("xkit-unnest", "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABMAAAATCAYAAAByUDbMAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAEtJREFUeNpiZICA/wz4ASMDEYCJYbACRiRvMlLqXZp48z81DGHBYijZ3qWqN1koSVfEuuw/NV1GjqGMVA2zUcOGk2Es5ORBXAAgwAD64ggp0tpGJAAAAABJRU5ErkJggg==", "UnNest", function() {
		        var iteration=$(this).data('iteration')||1
		        // Button toggles between case 1 behavior and case 2 behavior on alternate clicks
				switch ( iteration) {
					case 1:
						//alert("odd");
						XKit.extensions.unnest.toggleOne(this);
						break;
					
					case 2:
						//alert("even");
						XKit.extensions.unnest.toggleTwo(this);
						break;
				}
				iteration++;
				if (iteration>2) iteration=1
				$(this).data('iteration',iteration)
				//console.log("this.attr('data-post-id') =");
				//console.log($(this).attr('data-post-id'));
			});
			// Add post listener (enables extension to add buttons to newly loaded posts when endless scrolling is on)
			XKit.post_listener.add("unnest", XKit.extensions.unnest.makeButtons);
			XKit.extensions.unnest.makeButtons();

		}
		else {
			// Add post listener (enables extension to apply to newly loaded posts when endless scrolling is on)
			XKit.post_listener.add("unnest", XKit.extensions.unnest.applyToAll);
			XKit.extensions.unnest.applyToAll();
			//XKit.extensions.unnest.destroy();
		};
	},

	// This is what executes when the extension is disabled!
	destroy: function() {
		this.running = false;
		// Remove post listener
		XKit.post_listener.remove("unnest");
		//console.log("Hello from destroy()!");
		// Iterate over posts and reNest them
		$(".post:not('.new_post_buttons'):not('#tumblr_radar')").each( function (i, obj){
			XKit.extensions.unnest.reNest(obj);
		});
		// Not sure if necessary to remove buttons or how to do so, waiting to hear from XKit Guy
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
		if ($blockKids.length > 0) {
			// Run function recursively on that child
			return XKit.extensions.unnest.getInnerQuote($blockKids);
		}
		// Extra test for ask posts whose post_body divs contain extra divs
		else if ($obj.children("div.answer.post_info").length > 0) {
			return XKit.extensions.unnest.getInnerQuote($obj.children("div.answer.post_info"));
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
		//console.log("$innerQuote =");
		//console.log($innerQuote);
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
			if ($obj.contents().length > 0) {
				// If it's a godforsaken ask post
				if ($obj.children("div.note_wrapper").length > 0) {
					// Stick that in a variable
					$newComment = $obj.children("div.answer").contents();
				}
				else {
					// Stick that in a variable
					$newComment = $obj.contents();
				}
				// Remove them from the object
				$newComment.remove();
				// Add them to the new div
				$nextDiv.append($newComment);
			};
			// Again if it's an ask post
			if ($obj.children("div.answer").length > 0) {
				// Put everything from the new div into the appropriate special ask post div because ask posts are fussy
				$obj.children("div.answer.post_info").append($nextDiv.contents());
			}
			else {
				// Put everything from the new div back in the original object
				$obj.append($nextDiv.contents());
			}
			// Get rid of the new div
			$nextDiv.remove();
		};
	},

	unNest: function($obj) {
		// Define variable for object's innermost blockquote
		var $innerQuote = XKit.extensions.unnest.getInnerQuote($obj);
		//console.log("$innerQuote =");
		//console.log($innerQuote);
		// Only make changes if there's actually an inner quote to move
		if ($innerQuote != null) {
			var isAskPost = $obj.children("div.note_wrapper").length > 0;
			console.log(isAskPost);
			if (!XKit.extensions.unnest.chron) {
				// Wrap any text nodes in p tags
				var textnodes = XKit.extensions.unnest.getTextNodesIn($obj[0]);
				for(var i=0; i < textnodes.length; i++){
				    if ($(textnodes[i]).parent().is("div") || $(textnodes[i]).parent().is("blockquote")){
				        $(textnodes[i]).wrap("<p>");
				    };
				};
				// If it's a godforsaken ask post
				if (isAskPost) {
					if ($obj.children("div.answer").children().eq(1).is(":not('blockquote')")) {
						$obj.children("div.answer").children().eq(0).addClass("unnestTopMost");
						$obj.children("div.answer").children().eq(0).nextUntil("blockquote").filter(":not(':last')").addClass("unnestTopMost");
					};
				}
				else {
					if ($obj.children().eq(1).is(":not('blockquote')")) {
						$obj.children().eq(0).addClass("unnestTopMost");
						$obj.children().eq(0).nextUntil("blockquote").filter(":not(':last')").addClass("unnestTopMost");
					};
				};
			};
			// Add a new div after the object
			$obj.after("<div> </div>");
			// Define variable for new div
			var $nextDiv = $obj.next("div");
			// While there are still blockquotes in the object
			while ($innerQuote != null) {
				// Define variable for innermost blockquote plus its attribution
				var $attrib = $innerQuote.prev("p");
				var $fullComment = $attrib.add($innerQuote);
				if (!XKit.extensions.unnest.chron) {
					if ($attrib.parent().is("blockquote")) {
						$attrib.prevAll().addClass("unnestTop");

					};
					var $unnestTops = $innerQuote.children(".unnestTop");
					if ($unnestTops.length > 0) {
						$unnestTops.wrap("<blockquote />");
						var $attribClone = $attrib.clone();
						$nextDiv.prepend($unnestTops.parent());
						$nextDiv.prepend($attribClone);
					}
				};

				// Remove full comment
				$fullComment.remove();
				// Add full comment to new div
				$nextDiv.append($fullComment);
				// Reset variable to new innermost blockquote
				$innerQuote = XKit.extensions.unnest.getInnerQuote($obj);
			};
			// If there's anything left in the object (new unattributed comments)
			if ($obj.contents().length > 0) {
				if (!XKit.extensions.unnest.chron) {
					// If it's a godforsaken ask post
					if (isAskPost) {
						if ($obj.children("div.answer").children(".unnestTopMost").length > 0) {
							$newTopComment = $obj.children("div.answer").children(".unnestTopMost");
							$newTopComment.remove();
							$nextDiv.prepend($newTopComment);
						};
					}
					else {
						if ($obj.children(".unnestTopMost").length > 0) {
							$newTopComment = $obj.children(".unnestTopMost");
							$newTopComment.remove();
							$nextDiv.prepend($newTopComment);
						};
					};
				};
				// If it's a godforsaken ask post
				if (isAskPost) {
					// Stick that in a variable
					$newComment = $obj.children("div.answer").contents();
				}
				else {
					// Stick that in a variable
					$newComment = $obj.contents();
				}
				// Remove them from the object
				$newComment.remove();
				// Add them to the new div
				$nextDiv.append($newComment);
			};
			// Again if it's an ask post
			if (isAskPost) {
				// Put everything from the new div into the appropriate special ask post div because ask posts are fussy
				$obj.children("div.answer.post_info").append($nextDiv.contents());
			}
			else {
				// Put everything from the new div back in the original object
				$obj.append($nextDiv.contents());
			}
			// Get rid of the new div
			$nextDiv.remove();
		};
	},

	reNest: function($obj) {
		// Get post info
		var origPostObject = XKit.interface.post($obj);
		// Get post's original content by looking it up by post ID in the postContent object
		var $thisPostContent = XKit.extensions.unnest.postContent[origPostObject.id];
		//console.log("$obj.find('div.post_body') =");
		//console.log($obj.find("div.post_body"));
		// Remove post body
		$obj.find("div.post_body").remove();
		//console.log("$(thisPostContent)");
		//console.log($thisPostContent);
		// If it's a fussy ask post or photo/video/audio post
		if (($thisPostContent.find("div.note_wrapper").length > 0) || ($obj.find("div.post_media").length > 0)) {
			// Append original post body content back into the appropriate special div
			$obj.find("div.post_content_inner").append($thisPostContent.clone());
		}
		else {
			// Append original post body content
			$obj.find("div.post_container").append($thisPostContent.clone());
		};
	},

	applyToAll: function() {
		// Iterate over posts
		$(".post:not('.new_post_buttons'):not('#tumblr_radar')").each( function (i, obj){
			// Get post info
			//console.log("obj =");
			//console.log(obj);
			var origPostObject = XKit.interface.post(obj);
			//console.log("origPostObject =");
			//console.log(origPostObject);
			// Define variable as the post's descendant div.post_body
			var $thisDiv = $(obj).find("div.post_body");
			// Clone the post body div to the postContent object with its post id as a key.
			// This functions as a cache of the original post structure
			XKit.extensions.unnest.postContent[origPostObject.id] = $thisDiv.clone();
			//console.log("postContent =");
			//console.log(XKit.extensions.unnest.postContent);
			//console.log("$thisDiv =");
			//console.log($thisDiv);
			// Run unNest on the post body div
			XKit.extensions.unnest.unNest($thisDiv);
		});
	},

	makeButtons: function() {
		// Iterate over posts that do not already have buttons
		$(".post:not('.new_post_buttons'):not('#tumblr_radar'):not('.unnest-button')").each(function() {
			// Mark the post as having had a button added
			$(this).addClass('unnest-button');
			// Add the buttons to the posts
			XKit.interface.add_control_button(this, "xkit-unnest", "");
		});
	},

	toggleOne: function(obj) {
		//console.log("Hello from toggleOne()!");
		//console.log($(obj).attr('data-post-id'))
		//console.log($(obj).parents("div.post_full"));
		// Define variable as selected post ID, which is included as as attribute of the button itself
		var $postID = $(obj).attr('data-post-id');
		// Define variable as the outermost parent object of the post that XKit likes to work with
		var $post = $(obj).parents("div.post_full");
		// Define variable as the .post_body div that unNest works with
		var $postBody = $post.find("div.post_body");
		//console.log("$postBody =");
		//console.log($postBody);
		// If a post with this ID has not already been cached
		if (!(XKit.extensions.unnest.postContent.hasOwnProperty($postID))) {
			//console.log("Hello from if");
			// Copy that post into the cache file
			XKit.extensions.unnest.postContent[$postID] = $postBody.clone();
		};
		// Unnest the post!
		XKit.extensions.unnest.unNest($postBody);
	},

	toggleTwo: function(obj) {
		// Traverse up from the button to the actual main post div and put that in a variable
		$post = $(obj).parents("div.post_full");
		// Renest the post
		XKit.extensions.unnest.reNest($post);
	},

	// Makes it possible to find text nodes and wrap them with p tags so they don't gum up the works. Credit to Arash Milani on Stack Overflow
	getTextNodesIn: function(node, includeWhitespaceNodes) {
	    var textNodes = [], whitespace = /^\s*$/;

	    function getTextNodes(node) {
	        if (node.nodeType == 3) {
	            if (includeWhitespaceNodes || !whitespace.test(node.nodeValue)) {
	                textNodes.push(node);
	            }
	        } else {
	            for (var i = 0, len = node.childNodes.length; i < len; ++i) {
	                getTextNodes(node.childNodes[i]);
	            }
	        }
	    }

	    getTextNodes(node);
	    return textNodes;
	}
});