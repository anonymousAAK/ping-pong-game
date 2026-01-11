var ball = document.getElementById("ball");
var rod1 = document.getElementById("rod1");
var rod2 = document.getElementById("rod2");

var scoreEl = document.getElementById("score");
var maxScoreEl = document.getElementById("max-score");
var overlay = document.getElementById("overlay");
var messageText = document.getElementById("message-text");
var lastScoreDisplay = document.getElementById("last-score-display");
var twoPlayerModeCheckbox = document.getElementById("two-player-mode");

const storeName = "PPName";
const storeScore = "PPMaxScore";
const rod1Name = "Rod 1";
const rod2Name = "Rod 2";

let score,
  maxScore,
  movement,
  rod,
  ballSpeedX = 2,
  ballSpeedY = 2;

let gameOn = false;

let windowWidth = window.innerWidth,
  windowHeight = window.innerHeight;

(function () {
  rod = localStorage.getItem(storeName);
  maxScore = localStorage.getItem(storeScore);

  if (maxScore === null || maxScore === "null") {
    maxScore = 0;
    rod = "Rod1";
  }

  updateScoreBoard(0);

  // Show welcome message
  if (maxScore === 0) {
      messageText.innerText = "This is the first time you are playing this game , Use A & D. Press Enter to Start";
  } else {
      messageText.innerText = rod + " has maximum score of " + maxScore * 100 + ". Press Enter to Start";
  }

  resetBoard(rod);
})();

function resetBoard(rodName) {
  rod1.style.left = (window.innerWidth - rod1.offsetWidth) / 2 + "px";
  rod2.style.left = (window.innerWidth - rod2.offsetWidth) / 2 + "px";
  ball.style.left = (windowWidth - ball.offsetWidth) / 2 + "px";

  // Lossing player gets the ball
  if (rodName === rod2Name) {
    ball.style.top = rod1.offsetTop + rod1.offsetHeight + "px";
    ballSpeedY = 2;
  } else if (rodName === rod1Name) {
    ball.style.top = rod2.offsetTop - rod2.offsetHeight + "px";
    ballSpeedY = -2;
  }

  ballSpeedX = 2;
  score = 0;
  gameOn = false;
  updateScoreBoard(score);
  overlay.classList.remove("hidden");
}

window.addEventListener("resize", function () {
    windowWidth = window.innerWidth;
    windowHeight = window.innerHeight;

    // Recalculate positions if needed or just update limits
    // Keeping rods within bounds
    let rod1X = rod1.getBoundingClientRect().x;
    let rod2X = rod2.getBoundingClientRect().x;

    if (rod1X + rod1.offsetWidth > windowWidth) {
        rod1.style.left = (windowWidth - rod1.offsetWidth) + "px";
        rod2.style.left = (windowWidth - rod2.offsetWidth) + "px";
    }
});

function updateScoreBoard(currentScore) {
    scoreEl.innerText = currentScore * 100;
    maxScoreEl.innerText = maxScore * 100;
}

function storeWin(rod, score) {
  if (score > maxScore) {
    maxScore = score;
    localStorage.setItem(storeName, rod);
    localStorage.setItem(storeScore, maxScore);
  }

  clearInterval(movement);

  lastScoreDisplay.innerText = rod + " wins with a score of " + score * 100;
  messageText.innerText = "Press Enter to Restart";

  resetBoard(rod);
}

window.addEventListener("keydown", function (event) {
  let rodSpeed = 20;
  let isTwoPlayer = twoPlayerModeCheckbox.checked;

  let rod1Rect = rod1.getBoundingClientRect();
  let rod2Rect = rod2.getBoundingClientRect();

  // Rod 1 Movement (A/D)
  if (event.code === "KeyD" && rod1Rect.x + rod1Rect.width < window.innerWidth) {
    rod1.style.left = rod1Rect.x + rodSpeed + "px";
    if (!isTwoPlayer) {
        rod2.style.left = rod1.style.left;
    }
  } else if (event.code === "KeyA" && rod1Rect.x > 0) {
    rod1.style.left = rod1Rect.x - rodSpeed + "px";
    if (!isTwoPlayer) {
        rod2.style.left = rod1.style.left;
    }
  }

  // Rod 2 Movement (Left/Right) - Only in 2 Player Mode
  if (isTwoPlayer) {
      if (event.code === "ArrowRight" && rod2Rect.x + rod2Rect.width < window.innerWidth) {
          rod2.style.left = rod2Rect.x + rodSpeed + "px";
      } else if (event.code === "ArrowLeft" && rod2Rect.x > 0) {
          rod2.style.left = rod2Rect.x - rodSpeed + "px";
      }
  }

  if (event.code === "Enter") {
    if (!gameOn) {
      gameOn = true;
      overlay.classList.add("hidden");

      let ballRect = ball.getBoundingClientRect();
      let ballX = ballRect.x;
      let ballY = ballRect.y;
      let ballDia = ballRect.width;

      let rod1Height = rod1.offsetHeight;
      let rod2Height = rod2.offsetHeight;
      let rod1Width = rod1.offsetWidth;
      let rod2Width = rod2.offsetWidth;

      movement = setInterval(function () {
        // Move ball
        ballX += ballSpeedX;
        ballY += ballSpeedY;

        rod1X = rod1.getBoundingClientRect().x;
        rod2X = rod2.getBoundingClientRect().x;

        ball.style.left = ballX + "px";
        ball.style.top = ballY + "px";

        if (ballX + ballDia > windowWidth || ballX < 0) {
          ballSpeedX = -ballSpeedX; // Reverses the direction
        }

        // It specifies the center of the ball on the viewport
        let ballPos = ballX + ballDia / 2;

        // Check for Rod 1
        if (ballY <= rod1Height) {
          ballSpeedY = -ballSpeedY; // Reverses the direction
          score++;
          updateScoreBoard(score);

          // Increase speed
          if (ballSpeedY < 0) ballSpeedY -= 0.1;
          else ballSpeedY += 0.1;
          if (ballSpeedX < 0) ballSpeedX -= 0.1;
          else ballSpeedX += 0.1;

          // Check if the game ends
          if (ballPos < rod1X || ballPos > rod1X + rod1Width) {
            storeWin(rod2Name, score);
          }
        }

        // Check for Rod 2
        else if (ballY + ballDia >= windowHeight - rod2Height) {
          ballSpeedY = -ballSpeedY; // Reverses the direction
          score++;
          updateScoreBoard(score);

          // Increase speed
          if (ballSpeedY < 0) ballSpeedY -= 0.1;
          else ballSpeedY += 0.1;
          if (ballSpeedX < 0) ballSpeedX -= 0.1;
          else ballSpeedX += 0.1;

          // Check if the game ends
          if (ballPos < rod2X || ballPos > rod2X + rod2Width) {
            storeWin(rod1Name, score);
          }
        }
      }, 10);
    }
  }
});
