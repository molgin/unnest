

// Define post divs to match
var $post = $("div.post_body");

function getTextNodesIn(node, includeWhitespaceNodes) {
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
};

function hasPrevSibs(node) {
	var whitespace = /^\s*$/;
	var prevSib = node.previousSibling;
	if (prevSib === null) {
		return false;
	}
	else if (prevSib.nodeType === 3) {
		if (whitespace.test(prevSib.nodeValue)) {
			return hasPrevSibs(prevSib);
		}
		else {
			return true;
		}
	}
	else if (prevSib.nodeType > 1) {
		return hasPrevSibs(prevSib);
	}
	else {
		return true;
	};
};

function getPrevTextNodes(node) {
	var textNodes = [], whitespace = /^\s*$/;
	var prevSib = node.previousSibling;

	function getTextNodes(node) {
        if (node.nodeType == 3) {
            if (!whitespace.test(node.nodeValue)) {
                textNodes.push(node);
            };
        };
        if (node.previousSibling != null) {
        	getTextNodes(node.previousSibling);
        };
    }

    getTextNodes(prevSib);
    return textNodes;
};

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
	if ($blockKids.length > 0) {
		// Run function recursively on that child
		return getInnerQuote($blockKids);
	}
	// Extra test for ask posts whose post_body divs contain extra divs
	else if ($obj.children("div.answer.post_info").length > 0) {
		return getInnerQuote($obj.children("div.answer.post_info"));
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

// // Define a function to un-nest the blockquotes and their attributions
// function unNest($obj) {
// 	// Define variable for object's innermost blockquote
// 	var $innerQuote = getInnerQuote($obj);
// 	console.log("$innerQuote =");
// 	console.log($innerQuote);
// 	// Only make changes if there's actually an inner quote to move
// 	if ($innerQuote != null) {
// 		// Add a new div after the object
// 		$obj.after("<div> </div>");
// 		// Define variable for new div
// 		var $nextDiv = $obj.next("div");
// 		// While there are still blockquotes in the object
// 		while ($innerQuote != null) {
// 			// Define variable for innermost blockquote plus its attribution
// 			var $fullComment = $innerQuote.prev("p").add($innerQuote);
// 			// Remove full comment
// 			$fullComment.remove();
// 			// Add full comment to new div
// 			$nextDiv.append($fullComment);
// 			// Reset variable to new innermost blockquote
// 			$innerQuote = getInnerQuote($obj);
// 		};
// 		// If there's anything left in the object (new unattributed comments)
// 		if ($obj.contents().length > 0) {
// 			if ($obj.children("div.note_wrapper").length > 0) {
// 				// Stick them in a variable
// 				$newComment = $obj.children("div.answer").contents();
// 			}
// 			else {
// 				// Stick them in a variable
// 				$newComment = $obj.contents();
// 			}
// 			// Remove them from the object
// 			$newComment.remove();
// 			// Add them to the new div
// 			$nextDiv.append($newComment);
// 		};
// 		console.log("$obj.children('div.answer').length =");
// 		console.log($obj.find("div"));
// 		if ($obj.children("div.answer").length > 0) {
// 			$obj.children("div.answer.post_info").append($nextDiv.contents());
// 		}
// 		else {
// 			// Put everything from the new div back in the original object
// 			$obj.append($nextDiv.contents());
// 		}
// 		// Get rid of the new div
// 		$nextDiv.remove();
// 	};
// };

var chron = false;

function unNest($obj) {
		// Define variable for object's innermost blockquote
		var $innerQuote = getInnerQuote($obj);
		//console.log("$innerQuote =");
		//console.log($innerQuote);
		// Only make changes if there's actually an inner quote to move
		if ($innerQuote != null) {
			var isAskPost = $obj.children("div.note_wrapper").length > 0;
			console.log(isAskPost);
			if (!chron) {
				// // Wrap any text nodes in p tags
				// var textnodes = getTextNodesIn($obj[0]);
				// for(var i=0; i < textnodes.length; i++){
				//     if ($(textnodes[i]).parent().is(":not('p'):not('a'):not('span')")){
				//         $(textnodes[i]).wrap("<p>");
				//     };
				//};
				// If it's a godforsaken ask post
				console.log("1");
				// if (hasPrevSibs($obj.children("blockquote").prev()[0])) {
				// 	var textNodes = (getPrevTextNodes($obj.children("blockquote").prev()[0]));
				// 	for(var i=0; i < textNodes.length; i++){
				// 	    $(textNodes[i]).wrap("<p>");
				// 	};
				// };
				if (isAskPost) {
					if (hasPrevSibs($obj.children("div.answer").children("blockquote").prev()[0])) {
						var textNodes = (getPrevTextNodes($obj.children("div.answer").children("blockquote").prev()[0]));
						for(var i=0; i < textNodes.length; i++){
						    $(textNodes[i]).wrap("<p>");
						};
						if ($obj.children("div.answer").children().eq(1).is(":not('blockquote')")) {
							$obj.children("div.answer").children().eq(0).addClass("unnestTopMost");
							$obj.children("div.answer").children().eq(0).nextUntil("blockquote").filter(":not(':last')").addClass("unnestTopMost");
						};
					};
				}
				else {
					if (hasPrevSibs($obj.children("blockquote").prev()[0])) {
						var textNodes = (getPrevTextNodes($obj.children("blockquote").prev()[0]));
						for(var i=0; i < textNodes.length; i++){
						    $(textNodes[i]).wrap("<p>");
						};
						if ($obj.children().eq(1).is(":not('blockquote')")) {
							$obj.children().eq(0).addClass("unnestTopMost");
							$obj.children().eq(0).nextUntil("blockquote").filter(":not(':last')").addClass("unnestTopMost");
						};
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
				if (!chron) {
					if ($attrib.parent().is("blockquote")) {
						console.log("2");
						if (hasPrevSibs($attrib[0])) {
							var textNodes = (getPrevTextNodes($attrib[0]));
							for(var i=0; i < textNodes.length; i++){
							    $(textNodes[i]).wrap("<p>");
							};
							$attrib.prevAll().addClass("unnestTop");
						};

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
				$innerQuote = getInnerQuote($obj);
			};
			// If there's anything left in the object (new unattributed comments)
			if ($obj.contents().length > 0) {
				if (!chron) {
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
	}

// Iterate over the matching divs and unnest them
$("button#unnest").click(function(){
	$post.each( function (i, obj){
		unNest($(this));
	});
});

// unNest($("div.copy"));

//$("body").append($("p#butt-test").prevSibling());

console.log(hasPrevSibs($("#test1")[0]));
console.log(getPrevTextNodes($("#test1")[0]));

// var textnodes = (getPrevTextNodes($("#test1")[0]));
// for(var i=0; i < textnodes.length; i++){
//     //if ($(textnodes[i]).parent().is(":not('p'):not('a'):not('span')")){
//         $(textnodes[i]).wrap("<p>");
//     //};
// };


// TO DO LIST

// Merge newest unNest into unnest.js and test it on Tumblr 
// to make sure I haven't horribly broken anything. 
// Then commit.

// Then start work restructuring unNest. It should test early on
// whether the post is an ask post, then redefine $obj as
// $obj.children("div.answer"). Then I should be able to remove 
// all the isAskPost tests and behavior and have it still work.






























