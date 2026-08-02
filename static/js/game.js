/**
 * Rock Paper Scissors Game - Django Version
 * Handles all client-side game interactions and AJAX communication with Django backend
 */

class RockPaperScissorsGame {
    constructor() {
        // Game state
        this.isPlaying = false;
        this.scores = {
            player: 0,
            computer: 0,
            draws: 0
        };
        this.history = [];

        // Choice mappings
        this.choiceEmojis = {
            rock: '🗿',
            paper: '📄',
            scissors: '✂️'
        };

        // Get CSRF token from meta tag
        this.csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute('content');

        // Initialize game
        this.init();
    }

    /**
     * Initialize the game by binding event listeners and setting up UI
     */
    init() {
        this.bindEvents();
        this.updateUIFromServer();
        console.log('Rock Paper Scissors game initialized');
    }

    /**
     * Bind event listeners to game elements
     */
    bindEvents() {
        // Choice button event listeners
        const choiceButtons = document.querySelectorAll('.choice-btn');
        choiceButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                if (!this.isPlaying) {
                    const choice = btn.getAttribute('data-choice');
                    this.playRound(choice);
                }
            });
        });

        // Reset button event listener
        const resetBtn = document.getElementById('resetBtn');
        if (resetBtn) {
            resetBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.resetGame();
            });
        }
    }

    /**
     * Play a round of the game
     * @param {string} playerChoice - The player's choice (rock, paper, or scissors)
     */
    async playRound(playerChoice) {
        if (this.isPlaying) return;

        console.log('Playing round with:', playerChoice);

        try {
            // Set game state to playing
            this.isPlaying = true;
            this.disableChoiceButtons();
            this.showLoading();

            // Add selection animation to clicked button
            const selectedBtn = document.querySelector(`[data-choice="${playerChoice}"]`);
            if (selectedBtn) {
                selectedBtn.classList.add('selecting');
            }

            // Show battle area
            this.showBattleArea();

            // Animate battle preparation
            this.animateBattlePreparation(playerChoice);

            // Send move to Django backend
            const response = await this.sendMoveToServer(playerChoice);

            if (response.error) {
                throw new Error(response.error);
            }

            // Simulate some delay for better UX
            await this.delay(1000);

            // Update UI with results
            this.updateBattleDisplay(response.player_choice, response.computer_choice);
            this.displayResult(response.result, response.player_choice, response.computer_choice);
            this.updateScoreDisplay(response.player_score, response.computer_score, response.draw_score);
            this.updateHistory(response.game_history);

            // Re-enable game after delay
            await this.delay(2000);
            this.enableChoiceButtons();

        } catch (error) {
            console.error('Error playing round:', error);
            this.showError('Failed to play round. Please try again.');
            this.enableChoiceButtons();
        } finally {
            this.isPlaying = false;
            this.hideLoading();
            this.clearButtonSelections();
        }
    }

    /**
     * Send player's move to Django backend via AJAX
     * @param {string} choice - Player's choice
     * @returns {Promise} Response from server
     */
    async sendMoveToServer(choice) {
        const response = await fetch('/play/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': this.csrfToken,
            },
            body: JSON.stringify({ choice: choice })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    }

    /**
     * Reset the game by clearing all scores and history
     */
    async resetGame() {
        try {
            this.showLoading();

            const response = await fetch('/reset/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': this.csrfToken,
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (data.error) {
                throw new Error(data.error);
            }

            // Update UI with reset data
            this.updateScoreDisplay(data.player_score, data.computer_score, data.draw_score);
            this.updateHistory(data.game_history);
            this.hideBattleArea();

            // Show success message
            this.showSuccess('Game reset successfully!');

        } catch (error) {
            console.error('Error resetting game:', error);
            this.showError('Failed to reset game. Please try again.');
        } finally {
            this.hideLoading();
        }
    }

    /**
     * Show battle area with animation
     */
    showBattleArea() {
        const battleArea = document.getElementById('battleArea');
        if (battleArea) {
            battleArea.style.display = 'block';
            battleArea.classList.add('animate');
        }
    }

    /**
     * Hide battle area
     */
    hideBattleArea() {
        const battleArea = document.getElementById('battleArea');
        if (battleArea) {
            battleArea.style.display = 'none';
            battleArea.classList.remove('animate');
        }
    }

    /**
     * Animate battle preparation
     * @param {string} playerChoice - Player's choice
     */
    animateBattlePreparation(playerChoice) {
        // Show player choice immediately
        const playerBattleChoice = document.getElementById('playerBattleChoice');
        if (playerBattleChoice) {
            const playerEmoji = playerBattleChoice.querySelector('.battle-emoji');
            if (playerEmoji) {
                playerEmoji.textContent = this.choiceEmojis[playerChoice];
                playerBattleChoice.classList.add('animate');
            }
        }

        // Show computer choice as question mark initially
        const computerBattleChoice = document.getElementById('computerBattleChoice');
        if (computerBattleChoice) {
            const computerEmoji = computerBattleChoice.querySelector('.battle-emoji');
            if (computerEmoji) {
                computerEmoji.textContent = '❓';
                computerBattleChoice.classList.add('animate');
            }
        }

        // Reset result display
        const resultDisplay = document.getElementById('resultDisplay');
        if (resultDisplay) {
            resultDisplay.className = 'result-display';
            const resultText = document.getElementById('resultText');
            const resultDescription = document.getElementById('resultDescription');
            if (resultText) resultText.textContent = 'Computer is thinking...';
            if (resultDescription) resultDescription.textContent = '';
        }
    }

    /**
     * Update battle display with final choices
     * @param {string} playerChoice - Player's choice
     * @param {string} computerChoice - Computer's choice
     */
    updateBattleDisplay(playerChoice, computerChoice) {
        // Update computer choice
        const computerBattleChoice = document.getElementById('computerBattleChoice');
        if (computerBattleChoice) {
            const computerEmoji = computerBattleChoice.querySelector('.battle-emoji');
            if (computerEmoji) {
                computerEmoji.textContent = this.choiceEmojis[computerChoice];
            }
        }
    }

    /**
     * Display game result
     * @param {string} result - Game result (win, lose, draw)
     * @param {string} playerChoice - Player's choice
     * @param {string} computerChoice - Computer's choice
     */
    displayResult(result, playerChoice, computerChoice) {
        const resultDisplay = document.getElementById('resultDisplay');
        const resultText = document.getElementById('resultText');
        const resultDescription = document.getElementById('resultDescription');

        if (!resultDisplay || !resultText || !resultDescription) return;

        // Clear previous result classes
        resultDisplay.className = 'result-display';

        // Set result-specific styling and text
        switch (result) {
            case 'win':
                resultDisplay.classList.add('win');
                resultText.textContent = '🎉 7 crore milenge';
                resultDescription.textContent = this.getWinDescription(playerChoice, computerChoice);
                break;
            case 'lose':
                resultDisplay.classList.add('lose');
                resultText.textContent = '😔 Harr gaye aap';
                resultDescription.textContent = this.getWinDescription(computerChoice, playerChoice);
                break;
            case 'draw':
                resultDisplay.classList.add('draw');
                resultText.textContent = '🤝 Equally  ';
                resultDescription.textContent = `Both chose ${playerChoice}`;
                break;
        }
    }

    /**
     * Get winning description text
     * @param {string} winner - Winning choice
     * @param {string} loser - Losing choice
     * @returns {string} Description text
     */
    getWinDescription(winner, loser) {
        const descriptions = {
            'rock-scissors': 'Rock crushes Scissors',
            'paper-rock': 'Paper covers Rock',
            'scissors-paper': 'Scissors cuts Paper'
        };

        return descriptions[`${winner}-${loser}`] || `${winner} beats ${loser}`;
    }

    /**
     * Update score display
     * @param {number} playerScore - Player's score
     * @param {number} computerScore - Computer's score  
     * @param {number} drawScore - Draw count
     */
    updateScoreDisplay(playerScore, computerScore, drawScore) {
        const playerScoreEl = document.getElementById('playerScore');
        const computerScoreEl = document.getElementById('computerScore');
        const drawScoreEl = document.getElementById('drawScore');

        if (playerScoreEl) playerScoreEl.textContent = playerScore;
        if (computerScoreEl) computerScoreEl.textContent = computerScore;
        if (drawScoreEl) drawScoreEl.textContent = drawScore;

        // Store scores locally
        this.scores = { player: playerScore, computer: computerScore, draws: drawScore };
    }

    /**
     * Update game history display
     * @param {Array} history - Game history array
     */
    updateHistory(history) {
        const historyContainer = document.getElementById('historyContainer');
        if (!historyContainer || !history) return;

        // Clear existing history
        historyContainer.innerHTML = '';

        if (history.length === 0) {
            historyContainer.innerHTML = '<p class="no-history">No games played yet. Start playing to see your history!</p>';
            return;
        }

        // Add history items (show most recent first)
        const reversedHistory = [...history].reverse();
        reversedHistory.forEach(game => {
            const historyItem = this.createHistoryItem(game);
            historyContainer.appendChild(historyItem);
        });

        this.history = history;
    }

    /**
     * Create a history item element
     * @param {Object} game - Game data
     * @returns {HTMLElement} History item element
     */
    createHistoryItem(game) {
        const item = document.createElement('div');
        item.className = `history-item result-${game.result}`;

        const playerEmoji = this.choiceEmojis[game.player_choice];
        const computerEmoji = this.choiceEmojis[game.computer_choice];

        let resultText = 'Draw';
        if (game.result === 'win') resultText = 'You Won!';
        else if (game.result === 'lose') resultText = 'You Lost';

        item.innerHTML = `
            <div class="history-round">Round ${game.round_number}</div>
            <div class="history-choices">
                <span class="history-choice">${playerEmoji}</span>
                <span class="history-vs">vs</span>
                <span class="history-choice">${computerEmoji}</span>
            </div>
            <div class="history-result">${resultText}</div>
        `;

        return item;
    }

    /**
     * Disable choice buttons during game play
     */
    disableChoiceButtons() {
        const choiceButtons = document.querySelectorAll('.choice-btn');
        choiceButtons.forEach(btn => {
            btn.classList.add('disabled');
            btn.style.pointerEvents = 'none';
        });
    }

    /**
     * Enable choice buttons after game play
     */
    enableChoiceButtons() {
        const choiceButtons = document.querySelectorAll('.choice-btn');
        choiceButtons.forEach(btn => {
            btn.classList.remove('disabled');
            btn.style.pointerEvents = 'auto';
        });
    }

    /**
     * Clear button selection animations
     */
    clearButtonSelections() {
        const choiceButtons = document.querySelectorAll('.choice-btn');
        choiceButtons.forEach(btn => {
            btn.classList.remove('selecting');
        });
    }

    /**
     * Show loading overlay
     */
    showLoading() {
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) {
            loadingOverlay.style.display = 'flex';
        }
    }

    /**
     * Hide loading overlay
     */
    hideLoading() {
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) {
            loadingOverlay.style.display = 'none';
        }
    }

    /**
     * Show success message
     * @param {string} message - Success message
     */
    showSuccess(message) {
        // Create a simple toast notification
        this.showToast(message, 'success');
    }

    /**
     * Show error message
     * @param {string} message - Error message
     */
    showError(message) {
        // Create a simple toast notification
        this.showToast(message, 'error');
    }

    /**
     * Show toast notification
     * @param {string} message - Message to show
     * @param {string} type - Type of message (success, error)
     */
    showToast(message, type) {
        // Remove any existing toasts
        const existingToast = document.querySelector('.toast');
        if (existingToast) {
            existingToast.remove();
        }

        // Create toast element
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;

        // Add toast styles
        Object.assign(toast.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '15px 20px',
            borderRadius: '8px',
            color: 'white',
            fontWeight: '600',
            zIndex: '10000',
            animation: 'slideInFromRight 0.3s ease-out',
            maxWidth: '300px',
            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)'
        });

        if (type === 'success') {
            toast.style.background = 'linear-gradient(135deg, #10b981, #059669)';
        } else if (type === 'error') {
            toast.style.background = 'linear-gradient(135deg, #ef4444, #dc2626)';
        }

        // Add to page
        document.body.appendChild(toast);

        // Remove after 3 seconds
        setTimeout(() => {
            toast.style.animation = 'slideOutToRight 0.3s ease-in';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, 3000);
    }

    /**
     * Update UI from server data (for initialization)
     */
    updateUIFromServer() {
        // This would be called if we need to sync with server state on page load
        // For now, the template already provides the initial scores and history
        console.log('UI updated from server data');
    }

    /**
     * Utility function to create delays
     * @param {number} ms - Milliseconds to wait
     * @returns {Promise} Promise that resolves after delay
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Add additional CSS for toast animations
const toastStyles = `
    @keyframes slideInFromRight {
        from {
            opacity: 0;
            transform: translateX(100%);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }

    @keyframes slideOutToRight {
        from {
            opacity: 1;
            transform: translateX(0);
        }
        to {
            opacity: 0;
            transform: translateX(100%);
        }
    }
`;

// Inject toast styles
const styleSheet = document.createElement('style');
styleSheet.textContent = toastStyles;
document.head.appendChild(styleSheet);

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.gameInstance = new RockPaperScissorsGame();
});