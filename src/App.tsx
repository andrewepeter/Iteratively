import { useEffect, useState } from "react";
import type { Schema } from "../amplify/data/resource";
import { generateClient } from "aws-amplify/data";
import { useAuthenticator } from '@aws-amplify/ui-react';

const client = generateClient<Schema>();

function App() {
  const [todos, setTodos] = useState<Array<Schema["Todo"]["type"]>>([]);
  const [word, setWord] = useState('');
  const [isValidWord, setIsValidWord] = useState<boolean | null>(null);
  const { user, signOut } = useAuthenticator();

  useEffect(() => {
    client.models.Todo.observeQuery().subscribe({
      next: (data) => setTodos([...data.items]),
    });
  }, []);

  function createTodo() {
    client.models.Todo.create({ content: window.prompt("Todo content") });
  }
    
  function deleteTodo(id: string) {
    client.models.Todo.delete({ id })
  }

  return (
    <main>
      <h1>{user?.signInDetails?.loginId}'s todos</h1>
      <button onClick={createTodo}>+ new</button>
      <ul>
        {todos.map((todo) => (
          <li 
          onClick={() => deleteTodo(todo.id)}
          key={todo.id}>
          {todo.content}
          </li>
        ))}
      </ul>
      <div>
        🥳 App successfully hosted. Try creating a new todo.
        <br />
        <a href="https://docs.amplify.aws/react/start/quickstart/#make-frontend-updates">
          Review next step of this tutorial.
        </a>
      </div>
      
      <div>
        <input 
          type="text" 
          value={word}
          onChange={(e) => setWord(e.target.value)}
          placeholder="Enter a word to verify"
        />
        <button 
          onClick={async () => {
            try {
              const response = await fetch(`/api/validateWord?word=${word}`);
              const data = await response.json();
              console.log(data);
              console.log(response);
              setIsValidWord(data.isValid);
            } catch (error) {
              console.error('Error validating word:', error);
              setIsValidWord(null);
            }
          }}
        >
          Verify Word
        </button>
        {isValidWord !== null && (
          <p>
            {isValidWord ? 
              `"${word}" is a valid word!` : 
              `"${word}" is not a valid word.`
            }
          </p>
        )}
      </div>

      <button onClick={signOut}>Sign out</button>
    </main>
  );
}

export default App;