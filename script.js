const waterButton = document.querySelector('#water-button');
const scoreText = document.querySelector('#score');
const goalScoreText = document.querySelector('#goal-score');
const progressFill = document.querySelector('#progress-fill');
const progressTrack = document.querySelector('.progress-track');
const helperText = document.querySelector('#helper-text');
const resetButton = document.querySelector('#reset-button');
const confettiLayer = document.querySelector('#confetti-layer');
const leakAlert = document.querySelector('#leak-alert');
const fixButton = document.querySelector('#fix-button');

let score = 0;
let hasCelebratedGoal = false;
let leakIntervalId = null;
let confettiAnimationId = null;
const leakThresholds = [250, 500, 750];
let triggeredLeakThresholds = new Set();
const dailyGoal = 1000;

function updateScoreDisplay() {
	const progress = Math.min((score / dailyGoal) * 100, 100);
	scoreText.textContent = score.toLocaleString();
	goalScoreText.textContent = score.toLocaleString();
	progressFill.style.width = `${progress}%`;
	progressTrack.setAttribute('aria-valuenow', Math.min(score, dailyGoal));
}

function startLeak() {
	leakAlert.hidden = false;
	helperText.textContent = 'A leak is draining the tank. Fix it quickly!';
	leakIntervalId = setInterval(() => {
		score = Math.max(score - 5, 0);
		updateScoreDisplay();
	}, 1000);
}

function fixLeak() {
	if (leakIntervalId) {
		clearInterval(leakIntervalId);
		leakIntervalId = null;
	}
	leakAlert.hidden = true;
	helperText.textContent = 'Leak fixed! Keep those drops coming.';
}

function createWaterConfetti() {
	const buttonPosition = waterButton.getBoundingClientRect();
	const originX = buttonPosition.left + buttonPosition.width / 2;
	const originY = buttonPosition.top + buttonPosition.height * 0.45;
	const droplets = [];

	for (let index = 0; index < 36; index += 1) {
		const droplet = document.createElement('span');
		const drop = {
			element: droplet,
			x: originX,
			y: originY,
			velocityX: Math.random() * 440 - 220,
			velocityY: -280 - Math.random() * 260,
			gravity: 620,
			rotation: -45,
			rotationSpeed: Math.random() * 360 - 180,
			age: 0,
			life: 1.1 + Math.random() * 0.8
		};

		droplet.className = 'water-droplet';
		droplet.style.width = `${8 + Math.random() * 6}px`;
		droplet.style.height = `${10 + Math.random() * 8}px`;
		confettiLayer.appendChild(droplet);
		droplets.push(drop);
	}

	let previousTime = performance.now();
	function animateWaterConfetti(currentTime) {
		const secondsPassed = Math.min((currentTime - previousTime) / 1000, 0.05);
		previousTime = currentTime;

		droplets.forEach((drop) => {
			drop.age += secondsPassed;
			drop.velocityY += drop.gravity * secondsPassed;
			drop.x += drop.velocityX * secondsPassed;
			drop.y += drop.velocityY * secondsPassed;
			drop.rotation += drop.rotationSpeed * secondsPassed;
		drop.element.style.transform = `translate3d(${drop.x}px, ${drop.y}px, 0) rotate(${drop.rotation}deg)`;
		drop.element.style.opacity = `${Math.max(1 - drop.age / drop.life, 0)}`;
	});

		if (droplets.some((drop) => drop.age < drop.life)) {
			confettiAnimationId = requestAnimationFrame(animateWaterConfetti);
		} else {
			confettiLayer.replaceChildren();
			confettiAnimationId = null;
		}
	}

	confettiAnimationId = requestAnimationFrame(animateWaterConfetti);
}

function resetGame() {
	score = 0;
	hasCelebratedGoal = false;
	triggeredLeakThresholds = new Set();
	if (leakIntervalId) {
		clearInterval(leakIntervalId);
		leakIntervalId = null;
	}
	leakAlert.hidden = true;
	if (confettiAnimationId) {
		cancelAnimationFrame(confettiAnimationId);
		confettiAnimationId = null;
	}
	updateScoreDisplay();
	helperText.textContent = 'One tap makes a difference.';
	confettiLayer.replaceChildren();
}

// Add 10 ml each time the player collects water.
waterButton.addEventListener('click', () => {
	score += 10;
	updateScoreDisplay();

	const reachedThreshold = leakThresholds.find((threshold) => {
		return score >= threshold && !triggeredLeakThresholds.has(threshold);
	});
	if (reachedThreshold && score < dailyGoal) {
		triggeredLeakThresholds.add(reachedThreshold);
		if (!leakIntervalId) {
			startLeak();
		}
	}
	if (leakIntervalId) {
		return;
	}

	if (score >= dailyGoal) {
		if (!hasCelebratedGoal) {
			hasCelebratedGoal = true;
			createWaterConfetti();
		}
		helperText.textContent = 'Goal reached. Keep collecting or reset anytime.';
	} else if (score >= 750) {
		helperText.textContent = 'Amazing work. The tank is nearly full.';
	} else if (score >= 500) {
		helperText.textContent = 'Halfway there. You are making waves.';
	} else if (score >= 250) {
		helperText.textContent = 'Great start. Keep those drops coming.';
	} else if (score >= 100) {
		helperText.textContent = 'Nice work. Every drop counts.';
	}
});

resetButton.addEventListener('click', resetGame);
fixButton.addEventListener('click', fixLeak);
