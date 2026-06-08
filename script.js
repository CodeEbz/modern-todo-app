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

    // View state
    this.currentView = 'home';
    this.activeTaskId = null;
    this.homeView = document.getElementById('home-view');
    this.detailView = document.getElementById('detail-view');
    this.backBtn = document.getElementById('backBtn');

    // Search properties
    this.searchInput = document.getElementById('searchInput');
    this.searchQuery = '';

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
    this.soundSelect = document.getElementById('soundSelect');
    this.repeatSelect = document.getElementById('repeatSelect');

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

    // Search event
    if (this.searchInput) {
      this.searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value.toLowerCase();
        this.render();
      });
    }

    // Theme toggle event
    this.themeToggle.addEventListener('click', () => this.toggleTheme());

    // Reminder toggle event
    this.reminderBtn.addEventListener('click', () => this.toggleReminder());

    // Input validation on typing
    this.todoInput.addEventListener('input', () => this.validateInput());

    // Navigation events
    if (this.backBtn) {
      this.backBtn.addEventListener('click', () => this.closeTask());
    }
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
      reminder: this.reminderEnabled ? this.reminderInput.value : null,
      sound: this.reminderEnabled && this.soundSelect ? this.soundSelect.value : 'beep',
      repeat: this.reminderEnabled && this.repeatSelect ? this.repeatSelect.value : 'none',
      subtasks: []
    };

    // Add to todos array and update UI
    this.todos.unshift(todo);
    this.todoInput.value = '';
    if (this.reminderEnabled) {
      this.reminderInput.value = '';
      if (this.soundSelect) this.soundSelect.value = 'beep';
      if (this.repeatSelect) this.repeatSelect.value = 'none';
      this.toggleReminder();
    }
    this.saveTodos();
    this.render();

    // Show success feedback
    this.showSuccessFeedback();
    this.showToast('Task added successfully', 'success');
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
      
      if (todo.completed && todo.repeat && todo.repeat !== 'none') {
        const newTodo = { ...todo, id: Date.now(), completed: false, notified: false };
        const nextDate = new Date(todo.reminder || new Date());
        
        if (todo.repeat === 'daily') nextDate.setDate(nextDate.getDate() + 1);
        else if (todo.repeat === 'weekly') nextDate.setDate(nextDate.getDate() + 7);
        else if (todo.repeat === 'monthly') nextDate.setMonth(nextDate.getMonth() + 1);
        
        newTodo.reminder = nextDate.toISOString().slice(0, 16);
        newTodo.createdAt = new Date().toISOString();
        
        this.todos.unshift(newTodo);
      }
      
      this.saveTodos();
      this.render();
    }
  }

  // Delete a todo item
  deleteTodo(id) {
    this.todos = this.todos.filter(t => t.id !== id);
    this.saveTodos();
    this.render();
    this.showToast('Task deleted', 'error');
  }

  // Create subtask HTML
  createSubtaskHtml(todoId, subtask) {
    return `
      <div class="subtask-item ${subtask.completed ? 'completed' : ''}">
        <div class="subtask-checkbox ${subtask.completed ? 'checked' : ''}" 
             onclick="app.toggleSubtask(${todoId}, ${subtask.id})"></div>
        <span class="subtask-text" onclick="app.editSubtask(${todoId}, ${subtask.id}, this)">${this.escapeHtml(subtask.text)}</span>
        <button class="edit-subtask-btn" onclick="app.editSubtask(${todoId}, ${subtask.id}, this)" title="Edit subtask">✎</button>
        <button class="delete-subtask-btn" onclick="app.deleteSubtask(${todoId}, ${subtask.id})" title="Delete subtask">×</button>
      </div>
    `;
  }

  // Edit a subtask
  editSubtask(todoId, subtaskId, element) {
    const textSpan = element.classList.contains('subtask-text') ? element : element.parentElement.querySelector('.subtask-text');
    if (element.closest('.subtask-item').querySelector('.edit-input')) return;

    const todo = this.todos.find(t => t.id === todoId);
    if (!todo || !todo.subtasks) return;

    const subtask = todo.subtasks.find(st => st.id === subtaskId);
    if (!subtask) return;

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'edit-input';
    input.value = subtask.text;
    input.style.fontSize = '0.9rem';
    input.style.padding = '2px 5px';
    input.style.flex = '1';

    textSpan.replaceWith(input);
    input.focus();

    const saveEdit = () => {
      const newText = input.value.trim();
      if (newText && newText !== subtask.text) {
        subtask.text = newText;
        this.saveTodos();
        this.showToast('Subtask updated', 'success');
      } else {
        this.renderDetailView();
      }
    };

    input.addEventListener('blur', saveEdit);
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') saveEdit();
    });
    input.addEventListener('click', (e) => e.stopPropagation());
  }

  // Add a new subtask
  addSubtask(todoId) {
    const input = document.getElementById(`subtask-input-${todoId}`);
    const text = input.value.trim();
    if (!text) return;

    const todo = this.todos.find(t => t.id === todoId);
    if (!todo) return;
    
    if (!todo.subtasks) todo.subtasks = [];
    
    todo.subtasks.push({
      id: Date.now(),
      text: text,
      completed: false
    });
    
    this.saveTodos();
    this.render();
  }

  // Toggle subtask completion
  toggleSubtask(todoId, subtaskId) {
    const todo = this.todos.find(t => t.id === todoId);
    if (!todo || !todo.subtasks) return;
    
    const subtask = todo.subtasks.find(st => st.id === subtaskId);
    if (subtask) {
      subtask.completed = !subtask.completed;
      this.saveTodos();
      this.render();
    }
  }

  // Delete a subtask
  deleteSubtask(todoId, subtaskId) {
    const todo = this.todos.find(t => t.id === todoId);
    if (!todo || !todo.subtasks) return;
    
    todo.subtasks = todo.subtasks.filter(st => st.id !== subtaskId);
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
    let filtered = this.todos;

    switch (this.currentFilter) {
      case 'active':
        filtered = filtered.filter(todo => !todo.completed);
        break;
      case 'completed':
        filtered = filtered.filter(todo => todo.completed);
        break;
    }

    if (this.searchQuery) {
      filtered = filtered.filter(todo => todo.text.toLowerCase().includes(this.searchQuery));
    }

    return filtered;
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

    const subtaskCount = (todo.subtasks || []).length;
    let subtaskIndicator = '';
    if (subtaskCount > 0) {
      const completedCount = todo.subtasks.filter(st => st.completed).length;
      subtaskIndicator = `<div class="reminder-time" style="color: var(--text-primary);">📋 ${completedCount}/${subtaskCount} subtasks</div>`;
    }

    todoElement.innerHTML = `
      <div class="todo-main">
        <div class="checkbox ${todo.completed ? 'checked' : ''}" 
             onclick="event.stopPropagation(); app.toggleTodo(${todo.id})"></div>
        <div class="todo-content">
          <span class="todo-text">${this.escapeHtml(todo.text)}</span>
          <div style="display: flex; gap: 10px;">
            ${reminderHtml}
            ${subtaskIndicator}
          </div>
        </div>
        <div class="todo-actions">
          <button class="edit-btn" title="Edit todo" onclick="event.stopPropagation();">✎</button>
          <button class="delete-btn" onclick="event.stopPropagation(); app.deleteTodo(${todo.id})" 
                  title="Delete todo">×</button>
        </div>
      </div>
    `;

    // Add drag and drop event listeners
    this.addDragListeners(todoElement);

    const textSpan = todoElement.querySelector('.todo-text');

    // Inline editing logic
    const editLogic = (e) => {
      e.stopPropagation();
      // Don't edit if already editing
      if (todoElement.querySelector('.edit-input')) return;

      const input = document.createElement('input');
      input.type = 'text';
      input.className = 'edit-input';
      input.value = todo.text;

      textSpan.replaceWith(input);
      input.focus();

      const saveEdit = () => {
        const newText = input.value.trim();
        if (newText && newText !== todo.text) {
          todo.text = newText;
          this.saveTodos();
          this.showToast('Task updated', 'success');
        }
        this.render();
      };

      input.addEventListener('blur', saveEdit);
      input.addEventListener('keypress', (e2) => {
        if (e2.key === 'Enter') saveEdit();
      });
      input.addEventListener('click', (e2) => e2.stopPropagation());
    };

    textSpan.addEventListener('click', editLogic);
    
    const editBtn = todoElement.querySelector('.edit-btn');
    if (editBtn) {
      editBtn.addEventListener('click', editLogic);
    }
    
    // Navigate to detail view
    todoElement.addEventListener('click', () => {
      this.openTask(todo.id);
    });

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
    const svg = `<svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>`;
    const searchSvg = `<svg viewBox="0 0 24 24"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>`;
    const completeSvg = `<svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>`;

    if (this.searchQuery) {
      return `${searchSvg}<span>No tasks found matching "${this.escapeHtml(this.searchQuery)}"</span>`;
    }

    switch (this.currentFilter) {
      case 'active':
        return this.todos.length === 0 ? `${svg}<span>No tasks yet. Add one above!</span>` : `${completeSvg}<span>No active tasks! 🎉</span>`;
      case 'completed':
        return `${svg}<span>No completed tasks yet.</span>`;
      default:
        return `${svg}<span>No tasks yet. Add one above!</span>`;
    }
  }

  // Toggle reminder input visibility
  toggleReminder() {
    this.reminderEnabled = !this.reminderEnabled;
    this.reminderInput.style.display = this.reminderEnabled ? 'block' : 'none';
    if (this.soundSelect) this.soundSelect.style.display = this.reminderEnabled ? 'block' : 'none';
    if (this.repeatSelect) this.repeatSelect.style.display = this.reminderEnabled ? 'block' : 'none';
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
    this.playAlarmSound(todo.sound || 'beep');

    const modal = document.getElementById('alarmModal');
    const modalText = document.getElementById('alarmText');
    
    if (modal && modalText) {
      modalText.textContent = todo.text;
      modal.classList.add('active');
      
      const snoozeBtn = document.getElementById('snoozeBtn');
      const dismissBtn = document.getElementById('dismissBtn');
      
      const newSnooze = snoozeBtn.cloneNode(true);
      const newDismiss = dismissBtn.cloneNode(true);
      snoozeBtn.parentNode.replaceChild(newSnooze, snoozeBtn);
      dismissBtn.parentNode.replaceChild(newDismiss, dismissBtn);
      
      newSnooze.onclick = () => {
        this.stopAlarmSound();
        modal.classList.remove('active');
        todo.notified = false;
        
        const newTime = new Date();
        newTime.setMinutes(newTime.getMinutes() + 5);
        todo.reminder = newTime.toISOString().slice(0, 16);
        
        this.saveTodos();
        this.render();
      };
      
      newDismiss.onclick = () => {
        this.stopAlarmSound();
        modal.classList.remove('active');
      };
    }

    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Todo Reminder', {
        body: todo.text,
        icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><text y="18" font-size="18">⏰</text></svg>'
      });
    }
  }

  // Play alarm sound using Web Audio API
  playAlarmSound(soundType = 'beep') {
    try {
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      }
      
      if (!this.activeOscillators) {
        this.activeOscillators = [];
      }

      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      const now = this.audioContext.currentTime;
      
      if (soundType === 'chime') {
        oscillator.type = 'sine';
        for (let i = 0; i < 30; i++) {
          const start = now + (i * 0.5);
          oscillator.frequency.setValueAtTime(523.25, start);
          oscillator.frequency.setValueAtTime(659.25, start + 0.1);
          oscillator.frequency.setValueAtTime(783.99, start + 0.2);

          gainNode.gain.setValueAtTime(0, start);
          gainNode.gain.linearRampToValueAtTime(0.5, start + 0.05);
          gainNode.gain.exponentialRampToValueAtTime(0.01, start + 0.4);
        }
      } else if (soundType === 'buzz') {
        oscillator.type = 'sawtooth';
        for (let i = 0; i < 30; i++) {
          const start = now + (i * 0.5);
          oscillator.frequency.setValueAtTime(100, start);
          
          gainNode.gain.setValueAtTime(0, start);
          gainNode.gain.linearRampToValueAtTime(0.3, start + 0.05);
          gainNode.gain.setValueAtTime(0.3, start + 0.3);
          gainNode.gain.exponentialRampToValueAtTime(0.01, start + 0.4);
        }
      } else { // beep
        oscillator.type = 'sine';
        for (let i = 0; i < 30; i++) {
          const start = now + (i * 0.5);
          oscillator.frequency.setValueAtTime(800, start);
          oscillator.frequency.setValueAtTime(1200, start + 0.1);
          oscillator.frequency.setValueAtTime(800, start + 0.2);

          gainNode.gain.setValueAtTime(0, start);
          gainNode.gain.linearRampToValueAtTime(0.3, start + 0.05);
          gainNode.gain.setValueAtTime(0.3, start + 0.2);
          gainNode.gain.exponentialRampToValueAtTime(0.01, start + 0.4);
        }
      }

      oscillator.start(now);
      oscillator.stop(now + 15.0);
      
      this.activeOscillators.push(oscillator);
    } catch (error) {
      console.log('Audio not supported', error);
    }
  }

  stopAlarmSound() {
    if (this.activeOscillators) {
      this.activeOscillators.forEach(osc => {
        try { osc.stop(); } catch (e) {}
      });
      this.activeOscillators = [];
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
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const isToday = date.toDateString() === now.toDateString();
    const isTomorrow = date.toDateString() === tomorrow.toDateString();

    const timeStr = date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

    if (isToday) {
      return `Today at ${timeStr}`;
    } else if (isTomorrow) {
      return `Tomorrow at ${timeStr}`;
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ` at ${timeStr}`;
    }
  }

  // Show customized toast notification
  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    const iconFn = () => {
      switch (type) {
        case 'success': return '✅';
        case 'error': return '🗑️';
        case 'warning': return '⚠️';
        default: return 'ℹ️';
      }
    };

    toast.innerHTML = `<span>${iconFn()}</span> <span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('fade-out');
      toast.addEventListener('animationend', () => toast.remove());
    }, 3000);
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
      if (this.currentView === 'detail' && this.activeTaskId) {
        this.renderDetailView();
      }
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

  // View Navigation Methods
  openTask(id) {
    const todo = this.todos.find(t => t.id === id);
    if (!todo) return;

    this.activeTaskId = id;
    this.currentView = 'detail';
    
    if (this.homeView) this.homeView.classList.remove('active-view');
    if (this.detailView) this.detailView.classList.add('active-view');
    if (this.backBtn) this.backBtn.classList.add('visible');

    this.renderDetailView();
  }

  closeTask() {
    this.activeTaskId = null;
    this.currentView = 'home';
    
    if (this.detailView) this.detailView.classList.remove('active-view');
    if (this.homeView) this.homeView.classList.add('active-view');
    if (this.backBtn) this.backBtn.classList.remove('visible');

    this.render(); // Re-render list
  }

  renderDetailView() {
    const todo = this.todos.find(t => t.id === this.activeTaskId);
    if (!todo) return this.closeTask();

    const createdDate = new Date(todo.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
    const reminderText = todo.reminder ? `⏰ ${this.formatReminderTime(todo.reminder)}` : 'No reminder set';

    this.detailView.innerHTML = `
      <div class="detail-header">
        <div style="display: flex; align-items: start; justify-content: space-between;">
          <div class="detail-title" id="detailTitleText">${this.escapeHtml(todo.text)}</div>
          <button class="edit-btn" id="detailEditBtn" title="Edit todo">✎</button>
        </div>
        <div class="detail-meta">
          <span>📅 Created ${createdDate}</span>
          <span class="${todo.reminder ? this.getReminderStatus(todo.reminder) : ''}">${reminderText}</span>
        </div>
      </div>
      
      <div class="detail-section">
        <h3 class="detail-section-title">Subtasks</h3>
        <div class="subtasks-container" style="padding-left: 0;">
          <div class="subtasks-list" id="subtasks-${todo.id}">
            ${(todo.subtasks || []).map(st => this.createSubtaskHtml(todo.id, st)).join('')}
          </div>
          <div class="add-subtask-container">
            <input type="text" class="subtask-input" id="subtask-input-${todo.id}" placeholder="Add a new subtask..." onkeypress="if(event.key === 'Enter') app.addSubtask(${todo.id})">
            <button class="add-subtask-btn" onclick="app.addSubtask(${todo.id})">+</button>
          </div>
        </div>
      </div>
    `;

    // Add editing logic for the detail view title
    const detailTitle = document.getElementById('detailTitleText');
    const detailEditBtn = document.getElementById('detailEditBtn');

    const editDetailLogic = () => {
      if (document.getElementById('detailEditInput')) return;

      const input = document.createElement('input');
      input.type = 'text';
      input.id = 'detailEditInput';
      input.className = 'edit-input';
      input.style.fontSize = '1.5rem';
      input.style.fontWeight = '500';
      input.style.marginBottom = '10px';
      input.style.padding = '0';
      input.style.background = 'transparent';
      input.style.color = 'var(--text-primary)';
      input.style.border = 'none';
      input.style.borderBottom = '1px solid var(--text-primary)';
      input.style.borderRadius = '0';
      input.style.boxShadow = 'none';
      input.value = todo.text;

      detailTitle.replaceWith(input);
      input.focus();

      const saveEdit = () => {
        const newText = input.value.trim();
        if (newText && newText !== todo.text) {
          todo.text = newText;
          this.saveTodos();
          this.showToast('Task updated', 'success');
        } else {
          this.renderDetailView();
        }
      };

      input.addEventListener('blur', saveEdit);
      input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') saveEdit();
      });
    };

    if (detailTitle) detailTitle.addEventListener('click', editDetailLogic);
    if (detailEditBtn) detailEditBtn.addEventListener('click', editDetailLogic);
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