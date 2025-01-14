function HowToPlay() {
    return (
        <div className="max-w-4xl mx-auto p-8 bg-white rounded-lg shadow-lg mt-10">
            <h2 className="text-3xl font-bold mb-6 text-center text-gray-800">How to Play</h2>

            <div className="mb-6">
                <h3 className="text-xl font-semibold mb-2 text-blue-600">Start with the First Word</h3>
                <p className="text-gray-700">The game begins with a random word. Your goal is to build a chain of words by following the rules!</p>
            </div>

            <div className="mb-6">
                <h3 className="text-xl font-semibold mb-2 text-blue-600">Follow the Chain</h3>
                <p className="text-gray-700">
                    Type a word that starts with the last letter of the previous word.
                    <strong> Example:</strong> If the word is <strong>"Banana"</strong>, the next word must start with <strong>"A"</strong>, like <strong>"Apple"</strong>.
                </p>
            </div>

            <div className="mb-6">
                <h3 className="text-xl font-semibold mb-2 text-blue-600">Act Fast!</h3>
                <p className="text-gray-700">You have a limited amount of time to type the next word. Be quick to keep the chain alive!</p>
            </div>

            <div className="mb-6">
                <h3 className="text-xl font-semibold mb-2 text-blue-600">Score Points</h3>
                <ul className="list-disc list-inside text-gray-700 space-y-2">
                    <li><strong>+10 points</strong> for each valid word.</li>
                    <li><strong>-5 points</strong> for invalid words</li>
                    <li><strong>-15 points</strong> for using a word previously used.</li>
                </ul>
            </div>

            <div className="mb-6">
                <h3 className="text-xl font-semibold mb-2 text-blue-600">Combos and Bonuses</h3>
                <p className="text-gray-700">
                    Earn extra points by using rare letters like <strong>Q</strong>, <strong>Z</strong>, and <strong>X</strong>.
                    Build combos by entering multiple correct words quickly.
                    The longer the word, the more points you score!
                </p>
            </div>

            <div className="mb-6">
                <h3 className="text-xl font-semibold mb-2 text-blue-600">The Goal</h3>
                <p className="text-gray-700">Keep the word chain alive by typing words that follow the rules. Test your speed, vocabulary, and focus!</p>
            </div>
        </div>
    );
}

export default HowToPlay;
