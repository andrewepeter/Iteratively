function HowToPlay() {
    return (
        <div className="max-w-4xl mx-auto p-8 bg-white rounded-lg shadow-lg mt-10">
            <h2 className="text-2xl font-bold mb-4">How to Play</h2>
            <p className="mb-2"><strong>Start with the First Word</strong></p>
            <p className="mb-4">The game begins with a random word.</p>

            <p className="mb-2"><strong>Enter the Next Word</strong></p>
            <p className="mb-4">Type a word that starts with the last letter of the previous word. Example: If the word is "Banana", the next word must start with "A", like "Apple".</p>

            <p className="mb-2"><strong>Keep the Chain Alive</strong></p>
            <p className="mb-4">Every valid word keeps the chain going and earns points. Invalid words will break the chain.</p>

            <p className="mb-2"><strong>Act Fast!</strong></p>
            <p className="mb-4">You only have a limited amount of time to type the next word before the chain breaks.</p>

            <p className="mb-2"><strong>Score Big with Combos and Bonuses</strong></p>
            <p className="mb-4">Longer words and rare letters (like Q, Z, and X) give extra points. Build combos by quickly entering multiple correct words in a row!</p>

            <h3 className="text-xl font-bold mb-2">The Goal</h3>
            <p className="mb-4">Keep the word chain alive by typing words that start with the last letter of the previous word. Test your speed, vocabulary, and focus!</p>

            <p className="mb-2"><strong>Start the Game</strong></p>
            <p className="mb-4">Press the Start Game button to begin.</p>

            <p className="mb-2"><strong>Follow the Chain</strong></p>
            <p className="mb-4">A random word will appear. Type a word that starts with the last letter of the current word. Example: Current Word: Banana, Next Word: Apple.</p>

            <p className="mb-2"><strong>Earn Points</strong></p>
            <p className="mb-4">+10 points for each valid word. -5 points for invalid words or breaking the chain.</p>

            <p className="mb-2"><strong>Watch the Timer</strong></p>
            <p className="mb-4">You only have a limited time to enter the next word. React fast to keep the chain alive!</p>

            <p className="mb-2"><strong>Score Combos and Bonuses</strong></p>
            <p className="mb-4">Combos: Earn extra points for consecutive correct words. Bonuses: Use rare letters (like Q, Z, or X) or long words for more points.</p>
        </div>
    );
}

export default HowToPlay;