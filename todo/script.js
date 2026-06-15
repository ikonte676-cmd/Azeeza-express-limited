// Configuration du localStorage
const STORAGE_KEY = 'todoList';
const TODO_ID_KEY = 'todoIdCounter';

// Sélection des éléments du DOM
const todoInput = document.getElementById('todoInput');
const addBtn = document.getElementById('addBtn');
const todoList = document.getElementById('todoList');
const clearBtn = document.getElementById('clearBtn');
const deleteAllBtn = document.getElementById('deleteAllBtn');
const emptyState = document.getElementById('emptyState');
const filterBtns = document.querySelectorAll('.filter-btn');
const totalCount = document.getElementById('totalCount');
const completedCount = document.getElementById('completedCount');
const remainingCount = document.getElementById('remainingCount');

let currentFilter = 'all';
let todos = [];

// ===== FONCTIONS DE STOCKAGE =====

/**
 * Charge les tâches depuis le localStorage
 */
function loadTodos() {
    const saved = localStorage.getItem(STORAGE_KEY);
    todos = saved ? JSON.parse(saved) : [];
}

/**
 * Sauvegarde les tâches dans le localStorage
 */
function saveTodos() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
}

/**
 * Génère un ID unique pour chaque tâche
 */
function generateId() {
    let id = localStorage.getItem(TODO_ID_KEY);
    id = id ? parseInt(id) + 1 : 1;
    localStorage.setItem(TODO_ID_KEY, id);
    return id;
}

// ===== FONCTIONS DE GESTION DES TÂCHES =====

/**
 * Ajoute une nouvelle tâche
 */
function addTodo() {
    const text = todoInput.value.trim();
    
    if (text === '') {
        alert('Veuillez entrer une tâche!');
        return;
    }

    const newTodo = {
        id: generateId(),
        text: text,
        completed: false,
        createdAt: new Date().toLocaleString('fr-FR')
    };

    todos.push(newTodo);
    saveTodos();
    todoInput.value = '';
    render();
    todoInput.focus();
}

/**
 * Supprime une tâche par son ID
 */
function deleteTodo(id) {
    todos = todos.filter(todo => todo.id !== id);
    saveTodos();
    render();
}

/**
 * Bascule l'état complété d'une tâche
 */
function toggleTodo(id) {
    const todo = todos.find(t => t.id === id);
    if (todo) {
        todo.completed = !todo.completed;
        saveTodos();
        render();
    }
}

/**
 * Efface toutes les tâches complétées
 */
function clearCompleted() {
    if (todos.filter(t => t.completed).length === 0) {
        alert('Aucune tâche complétée à effacer!');
        return;
    }

    if (confirm('Êtes-vous sûr de vouloir effacer toutes les tâches complétées?')) {
        todos = todos.filter(todo => !todo.completed);
        saveTodos();
        render();
    }
}

/**
 * Supprime toutes les tâches
 */
function deleteAll() {
    if (todos.length === 0) {
        alert('Aucune tâche à supprimer!');
        return;
    }

    if (confirm('Êtes-vous sûr de vouloir supprimer TOUTES les tâches? Cette action est irréversible!')) {
        todos = [];
        saveTodos();
        render();
    }
}

/**
 * Filtre les tâches en fonction du filtre actif
 */
function getFilteredTodos() {
    switch (currentFilter) {
        case 'completed':
            return todos.filter(todo => todo.completed);
        case 'active':
            return todos.filter(todo => !todo.completed);
        default:
            return todos;
    }
}

/**
 * Met à jour les statistiques
 */
function updateStats() {
    const total = todos.length;
    const completed = todos.filter(t => t.completed).length;
    const remaining = total - completed;

    totalCount.textContent = total;
    completedCount.textContent = completed;
    remainingCount.textContent = remaining;
}

/**
 * Rend le contenu de la liste des tâches
 */
function render() {
    const filteredTodos = getFilteredTodos();
    todoList.innerHTML = '';

    if (todos.length === 0) {
        emptyState.classList.add('show');
        return;
    } else {
        emptyState.classList.remove('show');
    }

    filteredTodos.forEach(todo => {
        const li = document.createElement('li');
        li.className = `todo-item ${todo.completed ? 'completed' : ''}`;
        li.innerHTML = `
            <input 
                type="checkbox" 
                class="todo-checkbox" 
                ${todo.completed ? 'checked' : ''}
                onchange="toggleTodo(${todo.id})"
            >
            <span class="todo-text">${escapeHtml(todo.text)}</span>
            <button class="delete-btn" onclick="deleteTodo(${todo.id})">Supprimer</button>
        `;
        todoList.appendChild(li);
    });

    updateStats();
}

/**
 * Échappe les caractères HTML pour éviter les injections XSS
 */
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

// ===== GESTIONNAIRES D'ÉVÉNEMENTS =====

// Ajouter une tâche au clic du bouton
addBtn.addEventListener('click', addTodo);

// Ajouter une tâche en appuyant sur Entrée
todoInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        addTodo();
    }
});

// Boutons de filtre
filterBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
        filterBtns.forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        currentFilter = e.target.dataset.filter;
        render();
    });
});

// Boutons d'action
clearBtn.addEventListener('click', clearCompleted);
deleteAllBtn.addEventListener('click', deleteAll);

// ===== INITIALISATION =====

// Charger les tâches et afficher
loadTodos();
render();
todoInput.focus();