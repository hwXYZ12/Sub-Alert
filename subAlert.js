(() => {
	const fs = require('fs');		
	const KEYS_FILE_PATH = 'C:\\Users\\Will\\Desktop\\more stuff\\even more stuff\\alertKeys.json';
	const MAX_SUB_CHECK = 100;
	const POLL_RATE = 4000;
	const ANIMATIONS_CHECK_RATE = 2000;
	const TRANSITION_TIME = 2000;
	const STALL_TIME = 4500;
	const SUB_MESSAGE = " just subscribed ";
	const SUB_TIER_MESSAGES = ["using Twitch Prime!", "using a Tier 1 subscription!",
								"using a Tier 2 subscription!", "using a Tier 3 subscription!"];
			
	// get client id and client secret from local file	
	let keys = JSON.parse(fs.readFileSync(KEYS_FILE_PATH, 'utf-8'));						
					
	// sub alert sound
	let subSound = new Audio();
	subSound.src = "sounds\\im.ogg";	
		
	// get keys from the file
	let clientId = keys['clientId'];
	let clientSecret = keys['clientSecret'];	
	let channelId = keys['channelId'];		
	let authToken = keys['authToken'];
					
	// get a reference to the twitch api
	var twitchApi = require('twitch-api-v5');
	twitchApi.clientID = clientId;
				
	// continuously poll the Twitch API for a list of
	// the most recent 100 subs
	let recentSubs;
	let subStatus = {};
	let subName = {};

	// initialize the sub list with an initial twitch api call
		
	// try to call the twitch api for the sub list
	try{
		twitchApi.channels.subs({auth: authToken, channelID: channelId, limit: MAX_SUB_CHECK}, (errors, ret) => {

			if(errors||ret == null){
				console.log(errors);
				return;
			} else{

				recentSubs = new Set();
				
				let subListLength = Object.keys(ret.subscriptions).length;
				for(let i = 0; i < subListLength; ++i){
					recentSubs.add(ret.subscriptions[i].user._id);
					subStatus[ret.subscriptions[i].user._id] = ret.subscriptions[i].sub_plan
					subName[ret.subscriptions[i].user._id] = ret.subscriptions[i].user.name
					//newSubStack.push(ret.subscriptions[i].user._id);
				}	
			}
		});
	}catch(e){
		console.log("ERROR - Could not reach the Twitch server.");
	}
		
	// call the api every few seconds and check the new sub list
	// against the old sub list
	let newSubStack = [];
	function checkSubs(){
		
		// try to call the twitch api for the sub list
		try{

			twitchApi.channels.subs({auth: authToken, channelID: channelId, limit: MAX_SUB_CHECK}, (errors, ret) => {
			
				// TODO bizarre bug in which the sub list isn't returned properly
				if(ret == null){
					console.log(errors);
					return;
				}

				let newList = ret.subscriptions;

				// reverse the sub list (it is sorted chronologically from oldest to newest and we want
				//                      to start at the newest)
				newList = newList.reverse();
				
				// compare the new list to the old list
				// and find any differences
				let count = 0;
				while(count < MAX_SUB_CHECK){
					let newId = newList[count].user._id;
					let newName = newList[count].user.name;
					let plan = newList[count].sub_plan;

					if(recentSubs.has(newId)){
					 	// if it's not a new sub BUT the sub status has changed
						// then we push the new sub to the sub stack and update their status
						// and we DON'T break the loop
						if(plan != subStatus[newId]){
							newSubStack.push(newId);	
							subStatus[newId] = plan;
							subName[newId] = newName;
							++count;
						} else {
							break;
						}
					}else{					
						recentSubs.add(newId);
						newSubStack.push(newId);					
						subStatus[newId] = plan;
						subName[newId] = newName;
						theName = subName[theId];
						++count;
					}
				}

			});

		} catch(e){
			console.log("ERROR - Could not reach the Twitch server.");
		}
		
	}
	
	// pop a single sub alert from the stack display it
	let notAnimating = true;
	function handleAnimations(){
		
		if(newSubStack.length && notAnimating){

			// lock animation resources
			notAnimating = false;

			// set the sub alert text
			let theId = newSubStack.pop();
			let theName = subName[theId];
			let theText = document.getElementById('subText');
			let subTierAsString = subStatus[theId];
			let subTier = 0;
			if(subTierAsString === "Prime"){
				subTier = 0;
			} else {
				subTier = (+subTierAsString)/1000;
			}
			theText.textContent = theName+SUB_MESSAGE+SUB_TIER_MESSAGES[subTier];		

			// transition the sub alert into view
			let theSubAlert = document.getElementById('subAlert');
			subAlert.classList.add('isVisible');
			
			// play the current alert sound
			subSound.setTime = 0.00;
			subSound.play();
												
			// transition the follower alert out of view
			setTimeout(transitionAlert, TRANSITION_TIME+STALL_TIME);
			
			function transitionAlert(){
				
				// begin animation to remove the follower alert
				subAlert.classList.remove('isVisible');
				
				// unlock animation resources										
				setTimeout(() => {notAnimating = true;}, TRANSITION_TIME);
				
			}
		
		}
		
	}

	setInterval(checkSubs, POLL_RATE);	
	setInterval(handleAnimations, ANIMATIONS_CHECK_RATE);	

})()