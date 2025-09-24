// Todo App JavaScript - Complete functionality with drag & drop, filtering, and persistence

class TodoApp {
  constructor() {
    // Initialize app properties
    this.todos = [];
    this.currentFilter = 'all';
    this.draggedElement = null;
    this.currentTheme = 'gradient';
    this.themes = ['gradient', 'light', 'dark'];
    this.themeIcons = { gradient: '🌙', light: '☀️', dark: '🎨' };
    
    // Get DOM elements
    this.todoInput = document.querySelector('.todo-input');
    this.addBtn = document.querySelector('.add-btn');
    this.todoList = document.querySelector('.todo-list');
    this.filterBtns = document.querySelectorAll('.filter-btn');
    this.stats = document.querySelector('.stats');
    this.themeToggle = document.querySelector('.theme-toggle');
    this.themeIcon = document.querySelector('.theme-icon');
    this.reminderInput = document.querySelector('.reminder-input');
    this.reminderBtn = document.querySelector('.reminder-btn');
    
    // Reminder system
    this.reminderEnabled = false;
    this.reminderInterval = null;
    this.audioContext = null;
    
    // Initialize the app
    this.init();
  }
  
  // Initialize event listeners and load saved todos
  init() {
    this.loadTodos();
    this.loadTheme();
    this.bindEvents();
    this.initReminders();
    this.render();
  }
  
  // Bind all event listeners
  bindEvents() {
    // Add todo events
    this.addBtn.addEventListener('click', () => this.addTodo());
    this.todoInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.addTodo();
    });
    
    // Filter events
    this.filterBtns.forEach(btn => {
      btn.addEventListener('click', (e) => this.setFilter(e.target.dataset.filter));
    });
    
    // Theme toggle event
    this.themeToggle.addEventListener('click', () => this.toggleTheme());
    
    // Reminder toggle event
    this.reminderBtn.addEventListener('click', () => this.toggleReminder());
    
    // Input validation on typing
    this.todoInput.addEventListener('input', () => this.validateInput());
  }
  
  // Validate input field and provide visual feedback
  validateInput() {
    const input = this.todoInput.value.trim();
    if (input.length > 200) {
      this.todoInput.classList.add('shake');
      setTimeout(() => this.todoInput.classList.remove('shake'), 500);
    }
  }
  
  // Add a new todo item
  addTodo() {
    const text = this.todoInput.value.trim();
    
    // Validate input
    if (!text) {
      this.showInputError();
      return;
    }
    
    if (text.length > 200) {
      this.showInputError('Todo is too long (max 200 characters)');
      return;
    }
    
    // Create new todo object
    const todo = {
      id: Date.now(),
      text: text,
      completed: false,
      createdAt: new Date().toISOString(),
      reminder: this.reminderEnabled ? this.reminderInput.value : null
    };
    
    // Add to todos array and update UI
    this.todos.unshift(todo);
    this.todoInput.value = '';
    if (this.reminderEnabled) {
      this.reminderInput.value = '';
      this.toggleReminder();
    }
    this.saveTodos();
    this.render();
    
    // Show success feedback
    this.showSuccessFeedback();
  }
  
  // Show input validation error
  showInputError(message = 'Please enter a todo item') {
    this.todoInput.classList.add('shake');
    this.todoInput.placeholder = message;
    
    setTimeout(() => {
      this.todoInput.classList.remove('shake');
      this.todoInput.placeholder = 'Create a new todo...';
    }, 2000);
  }
  
  // Show success feedback when todo is added
  showSuccessFeedback() {
    const originalBg = this.addBtn.style.background;
    this.addBtn.style.background = 'linear-gradient(45deg, #00c851, #007e33)';
    
    setTimeout(() => {
      this.addBtn.style.background = originalBg;
    }, 300);
  }
  
  // Toggle todo completion status
  toggleTodo(id) {
    const todo = this.todos.find(t => t.id === id);
    if (todo) {
      todo.completed = !todo.completed;
      this.saveTodos();
      this.render();
    }
  }
  
  // Delete a todo item
  deleteTodo(id) {
    this.todos = this.todos.filter(t => t.id !== id);
    this.saveTodos();
    this.render();
  }
  
  // Set the current filter (all, active, completed)
  setFilter(filter) {
    this.currentFilter = filter;
    
    // Update active filter button
    this.filterBtns.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.filter === filter);
    });
    
    this.render();
  }
  
  // Get filtered todos based on current filter
  getFilteredTodos() {
    switch (this.currentFilter) {
      case 'active':
        return this.todos.filter(todo => !todo.completed);
      case 'completed':
        return this.todos.filter(todo => todo.completed);
      default:
        return this.todos;
    }
  }
  
  // Create HTML for a single todo item
  createTodoElement(todo) {
    const todoElement = document.createElement('div');
    todoElement.className = `todo-item ${todo.completed ? 'completed' : ''}`;
    todoElement.draggable = true;
    todoElement.dataset.id = todo.id;
    
    const reminderHtml = todo.reminder ? 
      `<div class="reminder-time ${this.getReminderStatus(todo.reminder)}">
        ⏰ ${this.formatReminderTime(todo.reminder)}
      </div>` : '';
    
    todoElement.innerHTML = `
      <div class="checkbox ${todo.completed ? 'checked' : ''}" 
           onclick="app.toggleTodo(${todo.id})"></div>
      <div class="todo-content">
        <span class="todo-text">${this.escapeHtml(todo.text)}</span>
        ${reminderHtml}
      </div>
      <button class="delete-btn" onclick="app.deleteTodo(${todo.id})" 
              title="Delete todo">×</button>
    `;
    
    // Add drag and drop event listeners
    this.addDragListeners(todoElement);
    
    return todoElement;
  }
  
  // Escape HTML to prevent XSS attacks
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
  
  // Add drag and drop functionality to todo elements
  addDragListeners(element) {
    element.addEventListener('dragstart', (e) => {
      this.draggedElement = element;
      element.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
    });
    
    element.addEventListener('dragend', () => {
      element.classList.remove('dragging');
      this.draggedElement = null;
      // Remove all drag-over classes
      document.querySelectorAll('.drag-over').forEach(el => {
        el.classList.remove('drag-over');
      });
    });
    
    element.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      
      if (this.draggedElement && this.draggedElement !== element) {
        element.classList.add('drag-over');
      }
    });
    
    element.addEventListener('dragleave', () => {
      element.classList.remove('drag-over');
    });
    
    element.addEventListener('drop', (e) => {
      e.preventDefault();
      element.classList.remove('drag-over');
      
      if (this.draggedElement && this.draggedElement !== element) {
        this.reorderTodos(this.draggedElement.dataset.id, element.dataset.id);
      }
    });
  }
  
  // Reorder todos after drag and drop
  reorderTodos(draggedId, targetId) {
    const draggedIndex = this.todos.findIndex(t => t.id == draggedId);
    const targetIndex = this.todos.findIndex(t => t.id == targetId);
    
    if (draggedIndex !== -1 && targetIndex !== -1) {
      // Remove dragged item and insert at target position
      const [draggedTodo] = this.todos.splice(draggedIndex, 1);
      this.todos.splice(targetIndex, 0, draggedTodo);
      
      this.saveTodos();
      this.render();
    }
  }
  
  // Update statistics display
  updateStats() {
    const activeTodos = this.todos.filter(todo => !todo.completed);
    const totalTodos = this.todos.length;
    const completedTodos = totalTodos - activeTodos.length;
    
    let statsText = '';
    if (totalTodos === 0) {
      statsText = 'No tasks yet';
    } else if (activeTodos.length === 0) {
      statsText = `All ${totalTodos} task${totalTodos !== 1 ? 's' : ''} completed! 🎉`;
    } else {
      statsText = `${activeTodos.length} task${activeTodos.length !== 1 ? 's' : ''} left`;
      if (completedTodos > 0) {
        statsText += ` • ${completedTodos} completed`;
      }
    }
    
    this.stats.textContent = statsText;
  }
  
  // Main render function to update the UI
  render() {
    const filteredTodos = this.getFilteredTodos();
    
    // Clear current todos
    this.todoList.innerHTML = '';
    
    if (filteredTodos.length === 0) {
      // Show empty state message
      const emptyMessage = this.getEmptyMessage();
      this.todoList.innerHTML = `<div class="empty-state">${emptyMessage}</div>`;
    } else {
      // Render filtered todos
      filteredTodos.forEach(todo => {
        const todoElement = this.createTodoElement(todo);
        this.todoList.appendChild(todoElement);
      });
    }
    
    // Update statistics
    this.updateStats();
  }
  
  // Get appropriate empty state message based on current filter
  getEmptyMessage() {
    switch (this.currentFilter) {
      case 'active':
        return this.todos.length === 0 ? 'No tasks yet. Add one above!' : 'No active tasks! 🎉';
      case 'completed':
        return 'No completed tasks yet.';
      default:
        return 'No tasks yet. Add one above!';
    }
  }
  
  // Toggle reminder input visibility
  toggleReminder() {
    this.reminderEnabled = !this.reminderEnabled;
    this.reminderInput.style.display = this.reminderEnabled ? 'block' : 'none';
    this.reminderBtn.classList.toggle('active', this.reminderEnabled);
    
    if (this.reminderEnabled) {
      const now = new Date();
      now.setMinutes(now.getMinutes() + 30);
      this.reminderInput.value = now.toISOString().slice(0, 16);
      this.reminderInput.focus();
    }
  }
  
  // Initialize reminder system
  initReminders() {
    this.reminderInput.style.display = 'none';
    this.startReminderChecker();
  }
  
  // Start checking for due reminders
  startReminderChecker() {
    this.reminderInterval = setInterval(() => {
      this.checkReminders();
    }, 30000); // Check every 30 seconds
  }
  
  // Check for due reminders
  checkReminders() {
    const now = new Date();
    this.todos.forEach(todo => {
      if (todo.reminder && !todo.completed && !todo.notified) {
        const reminderTime = new Date(todo.reminder);
        if (now >= reminderTime) {
          this.showReminderNotification(todo);
          todo.notified = true;
          this.saveTodos();
        }
      }
    });
  }
  
  // Show reminder notification with sound
  showReminderNotification(todo) {
    this.playAlarmSound();
    
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Todo Reminder', {
        body: todo.text,
        icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><text y="18" font-size="18">⏰</text></svg>'
      });
    } else {
      alert(`Reminder: ${todo.text}`);
    }
  }
  
  // Play alarm sound using Web Audio API
  playAlarmSound() {
    try {
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      }
      
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime);
      oscillator.frequency.setValueAtTime(1000, this.audioContext.currentTime + 0.1);
      oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime + 0.2);
      
      gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);
      
      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + 0.5);
    } catch (error) {
      console.log('Audio not supported');
    }
  }
  
  // Get reminder status class
  getReminderStatus(reminderTime) {
    const now = new Date();
    const reminder = new Date(reminderTime);
    const diff = reminder - now;
    
    if (diff < 0) return 'overdue';
    if (diff < 3600000) return 'upcoming'; // 1 hour
    return '';
  }
  
  // Format reminder time for display
  formatReminderTime(reminderTime) {
    const date = new Date(reminderTime);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    }
  }

  // Toggle between themes (gradient -> light -> dark -> gradient)
  toggleTheme() {
    const currentIndex = this.themes.indexOf(this.currentTheme);
    const nextIndex = (currentIndex + 1) % this.themes.length;
    this.currentTheme = this.themes[nextIndex];
    this.applyTheme();
    this.saveTheme();
  }
  
  // Apply the current theme to the document
  applyTheme() {
    // Remove existing theme attributes
    document.documentElement.removeAttribute('data-theme');
    
    // Apply new theme (gradient is default, no attribute needed)
    if (this.currentTheme !== 'gradient') {
      document.documentElement.setAttribute('data-theme', this.currentTheme);
    }
    
    // Update theme icon
    this.themeIcon.textContent = this.themeIcons[this.currentTheme];
  }
  
  // Save current theme to localStorage
  saveTheme() {
    try {
      localStorage.setItem('theme', this.currentTheme);
    } catch (error) {
      console.error('Failed to save theme:', error);
    }
  }
  
  // Load theme from localStorage
  loadTheme() {
    try {
      const saved = localStorage.getItem('theme');
      if (saved && this.themes.includes(saved)) {
        this.currentTheme = saved;
      }
      this.applyTheme();
    } catch (error) {
      console.error('Failed to load theme:', error);
    }
  }

  // Save todos to localStorage
  saveTodos() {
    try {
      localStorage.setItem('todos', JSON.stringify(this.todos));
    } catch (error) {
      console.error('Failed to save todos:', error);
    }
  }
  
  // Load todos from localStorage
  loadTodos() {
    try {
      const saved = localStorage.getItem('todos');
      if (saved) {
        this.todos = JSON.parse(saved);
      }
    } catch (error) {
      console.error('Failed to load todos:', error);
      this.todos = [];
    }
  }
  
  // Clear all completed todos (bonus feature)
  clearCompleted() {
    this.todos = this.todos.filter(todo => !todo.completed);
    this.saveTodos();
    this.render();
  }
  
  // Mark all todos as completed (bonus feature)
  completeAll() {
    const allCompleted = this.todos.every(todo => todo.completed);
    this.todos.forEach(todo => {
      todo.completed = !allCompleted;
    });
    this.saveTodos();
    this.render();
  }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Request notification permission
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
  
  // Create global app instance
  window.app = new TodoApp();
  
  // Add keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + A to toggle all todos
    if ((e.ctrlKey || e.metaKey) && e.key === 'a' && e.target !== app.todoInput) {
      e.preventDefault();
      app.completeAll();
    }
    
    // Ctrl/Cmd + Shift + C to clear completed
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'C') {
      e.preventDefault();
      app.clearCompleted();
    }
    
    // Escape to clear input
    if (e.key === 'Escape' && e.target === app.todoInput) {
      app.todoInput.value = '';
      app.todoInput.blur();
    }
  });
  
  // Add touch support for mobile drag and drop
  let touchItem = null;
  let touchOffset = { x: 0, y: 0 };
  
  document.addEventListener('touchstart', (e) => {
    const todoItem = e.target.closest('.todo-item');
    if (todoItem) {
      touchItem = todoItem;
      const touch = e.touches[0];
      const rect = todoItem.getBoundingClientRect();
      touchOffset.x = touch.clientX - rect.left;
      touchOffset.y = touch.clientY - rect.top;
    }
  });
  
  document.addEventListener('touchmove', (e) => {
    if (touchItem) {
      e.preventDefault();
      const touch = e.touches[0];
      touchItem.style.position = 'fixed';
      touchItem.style.left = (touch.clientX - touchOffset.x) + 'px';
      touchItem.style.top = (touch.clientY - touchOffset.y) + 'px';
      touchItem.style.zIndex = '1000';
      touchItem.classList.add('dragging');
    }
  });
  
  document.addEventListener('touchend', (e) => {
    if (touchItem) {
      touchItem.style.position = '';
      touchItem.style.left = '';
      touchItem.style.top = '';
      touchItem.style.zIndex = '';
      touchItem.classList.remove('dragging');
      
      // Find drop target
      const touch = e.changedTouches[0];
      const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
      const dropTarget = elementBelow?.closest('.todo-item');
      
      if (dropTarget && dropTarget !== touchItem) {
        app.reorderTodos(touchItem.dataset.id, dropTarget.dataset.id);
      }
      
      touchItem = null;
    }
  });
});

// Export for potential module use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TodoApp;
}