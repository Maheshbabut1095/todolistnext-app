import { useEffect, useState } from 'react';
import { supabase } from '../utils/supabaseClient';
import { useRouter } from 'next/router';
import dayjs from 'dayjs';

export default function Home() {
  const [user, setUser] = useState(null);
  const [todos, setTodos] = useState([]);
  const [filteredTodos, setFilteredTodos] = useState([]);
  const [filter, setFilter] = useState('all');
  const [newTask, setNewTask] = useState('');
  const [users, setUsers] = useState([]);
  const [assignedTo, setAssignedTo] = useState('');
  const [dueDate, setDueDate] = useState('');
  const router = useRouter();

  // Check session
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) router.push('/auth');
      else setUser(session.user);
    };
    checkSession();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) router.push('/auth');
      else setUser(session.user);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  // Fetch data
  useEffect(() => {
    if (user) {
      fetchTodos();
      fetchUsers();
      setupRealtimeSubscription();
    }
  }, [user]);

  const fetchTodos = async () => {
    const { data, error } = await supabase
      .from('todos')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error) {
      setTodos(data);
      applyFilter(data, filter);
    }
  };

  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, username');
    if (!error) setUsers(data);
  };

  const applyFilter = (todos, filterType) => {
    const today = dayjs().format('YYYY-MM-DD');

    let filtered = todos;
    if (filterType === 'assigned') {
      filtered = todos.filter(t => t.assigned_to === user.id);
    } else if (filterType === 'created') {
      filtered = todos.filter(t => t.created_by === user.id);
    } else if (filterType === 'overdue') {
      filtered = todos.filter(t => t.due_date && t.due_date < today);
    } else if (filterType === 'today') {
      filtered = todos.filter(t => t.due_date === today);
    }

    setFilteredTodos(filtered);
  };

  useEffect(() => {
    applyFilter(todos, filter);
  }, [filter, todos]);

  const addTodo = async () => {
    if (!newTask) return alert('Please enter a task.');
    if (!user || !user.id) return alert('User not loaded yet.');

    const { data, error } = await supabase.from('todos').insert([
      {
        task: newTask,
        created_by: user.id,
        assigned_to: assignedTo || null,
        due_date: dueDate || null
      }
    ]);

    if (error) {
      console.error('Insert error:', error);
      alert('Error adding task: ' + error.message);
    } else {
      setNewTask('');
      setAssignedTo('');
      setDueDate('');
      fetchTodos();
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/auth');
  };

  // Realtime notification when someone assigns a task to current user
  const setupRealtimeSubscription = () => {
    supabase
      .channel('todos')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'todos'
      }, payload => {
        const task = payload.new;
        if (task.assigned_to === user?.id && task.created_by !== user?.id) {
          alert(`📬 New task assigned to you: "${task.task}"`);
        }
      })
      .subscribe();
  };

  return (
    <div className="container">
      <h1>📝 Todo List</h1>

      <input
        type="text"
        placeholder="New task..."
        value={newTask}
        onChange={e => setNewTask(e.target.value)}
      />

      <select value={assignedTo} onChange={e => setAssignedTo(e.target.value)}>
        <option value="">Assign to (optional)</option>
        {users.map(u => (
          <option key={u.id} value={u.id}>
            {u.username || u.email}
          </option>
        ))}
      </select>

      <input
        type="date"
        value={dueDate}
        onChange={e => setDueDate(e.target.value)}
      />

      <button onClick={addTodo}>Add Task</button>
      <button className="logout" onClick={handleLogout}>Logout</button>

      <div className="filters">
        <button onClick={() => setFilter('all')}>All</button>
        <button onClick={() => setFilter('assigned')}>Assigned to Me</button>
        <button onClick={() => setFilter('created')}>Created by Me</button>
        <button onClick={() => setFilter('overdue')}>Overdue</button>
        <button onClick={() => setFilter('today')}>Due Today</button>
      </div>

      <div className="todo-list">
        {filteredTodos.map(todo => (
          <div key={todo.id} className="task">
            <p><strong>{todo.task}</strong></p>
            <p className="small">Assigned to: {users.find(u => u.id === todo.assigned_to)?.username || 'None'}</p>
            <p className="small">Due: {todo.due_date || 'N/A'}</p>
          </div>
        ))}
      </div>

      <style jsx>{`
        .container {
          max-width: 600px;
          margin: 40px auto;
          background: white;
          padding: 24px;
          border-radius: 12px;
          box-shadow: 0 6px 20px rgba(0,0,0,0.1);
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }

        h1 {
          text-align: center;
          color: #2563eb;
          font-weight: bold;
          margin-bottom: 24px;
        }

        input, select {
          width: 100%;
          padding: 12px;
          margin: 8px 0;
          font-size: 16px;
          border: 1px solid #ccc;
          border-radius: 8px;
        }

        button {
          width: 100%;
          padding: 12px;
          font-size: 16px;
          background-color: #2563eb;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          margin-top: 10px;
        }

        button.logout {
          background-color: #ef4444;
          margin-top: 16px;
        }

        .filters button {
          background: #f3f4f6;
          color: #111827;
          padding: 8px 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          margin-right: 6px;
          margin-top: 16px;
          cursor: pointer;
        }

        .filters {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin: 10px 0;
        }

        .todo-list {
          margin-top: 30px;
        }

        .task {
          background: #f0f4ff;
          padding: 16px;
          border-radius: 8px;
          margin-bottom: 14px;
          box-shadow: 0 2px 6px rgba(0,0,0,0.05);
        }

        .small {
          font-size: 14px;
          color: #4b5563;
          margin-top: 4px;
        }
      `}</style>
    </div>
  );
}
