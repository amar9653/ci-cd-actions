"""
Views for the Rock Paper Scissors game.

This module contains the view functions that handle:
1. Home page display with the game interface
2. AJAX endpoint for handling game moves and returning results
"""

import random
import json
from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods


def home(request):
    """
    Display the home page with the game interface.

    Initializes session data if not present and renders the main game template.
    """
    # Initialize session data if not present
    if 'player_score' not in request.session:
        request.session['player_score'] = 0
        request.session['computer_score'] = 0
        request.session['draw_score'] = 0
        request.session['game_history'] = []

    context = {
        'player_score': request.session.get('player_score', 0),
        'computer_score': request.session.get('computer_score', 0),
        'draw_score': request.session.get('draw_score', 0),
        'game_history': request.session.get('game_history', []),
    }

    return render(request, 'game/index.html', context)


@csrf_exempt
@require_http_methods(["POST"])
def play_move(request):
    """
    Handle AJAX requests for game moves.

    Processes the player's choice, generates computer's choice,
    determines the winner, updates scores, and returns the result.
    """
    try:
        # Initialize session data if not present
        if 'player_score' not in request.session:
            request.session['player_score'] = 0
            request.session['computer_score'] = 0
            request.session['draw_score'] = 0
            request.session['game_history'] = []

        # Parse the JSON data from the request
        data = json.loads(request.body)
        player_choice = data.get('choice')

        # Validate player choice
        valid_choices = ['rock', 'paper', 'scissors']
        if player_choice not in valid_choices:
            return JsonResponse({
                'error': 'Invalid choice. Must be rock, paper, or scissors.'
            }, status=400)

        # Generate computer's choice randomly
        computer_choice = random.choice(valid_choices)

        # Determine the winner using game logic
        result = determine_winner(player_choice, computer_choice)

        # Update session scores
        if result == 'win':
            request.session['player_score'] = request.session.get('player_score', 0) + 1
        elif result == 'lose':
            request.session['computer_score'] = request.session.get('computer_score', 0) + 1
        elif result == 'draw':
            request.session['draw_score'] = request.session.get('draw_score', 0) + 1

        # Add to game history (keep last 10 games)
        game_history = request.session.get('game_history', [])
        game_round = {
            'player_choice': player_choice,
            'computer_choice': computer_choice,
            'result': result,
            'round_number': len(game_history) + 1
        }
        game_history.append(game_round)

        # Keep only last 10 games
        if len(game_history) > 10:
            game_history = game_history[-10:]

        request.session['game_history'] = game_history
        request.session.modified = True  # Ensure session is saved

        # Return the game result
        response_data = {
            'player_choice': player_choice,
            'computer_choice': computer_choice,
            'result': result,
            'player_score': request.session['player_score'],
            'computer_score': request.session['computer_score'],
            'draw_score': request.session['draw_score'],
            'game_history': game_history
        }

        return JsonResponse(response_data)

    except json.JSONDecodeError:
        return JsonResponse({
            'error': 'Invalid JSON data'
        }, status=400)
    except Exception as e:
        return JsonResponse({
            'error': f'An error occurred: {str(e)}'
        }, status=500)


@csrf_exempt
@require_http_methods(["POST"])
def reset_game(request):
    """
    Reset all game scores and history.

    Clears session data and returns updated scores.
    """
    try:
        # Reset all session data
        request.session['player_score'] = 0
        request.session['computer_score'] = 0
        request.session['draw_score'] = 0
        request.session['game_history'] = []
        request.session.modified = True

        return JsonResponse({
            'message': 'Game reset successfully',
            'player_score': 0,
            'computer_score': 0,
            'draw_score': 0,
            'game_history': []
        })

    except Exception as e:
        return JsonResponse({
            'error': f'An error occurred: {str(e)}'
        }, status=500)


def determine_winner(player_choice, computer_choice):
    """
    Determine the winner of a rock-paper-scissors round.

    Args:
        player_choice (str): The player's choice (rock, paper, or scissors)
        computer_choice (str): The computer's choice (rock, paper, or scissors)

    Returns:
        str: 'win' if player wins, 'lose' if computer wins, 'draw' if it's a tie
    """
    # Same choice is a draw
    if player_choice == computer_choice:
        return 'draw'

    # Define winning combinations for the player
    winning_combinations = {
        'rock': 'scissors',      # Rock crushes scissors
        'paper': 'rock',         # Paper covers rock
        'scissors': 'paper'      # Scissors cuts paper
    }

    # Check if player wins
    if winning_combinations[player_choice] == computer_choice:
        return 'win'
    else:
        return 'lose'
