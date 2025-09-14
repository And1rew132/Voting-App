// EU Voting App Frontend JavaScript
let currentPoll = null;

// Tab Management
function showTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Remove active class from all buttons
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected tab
    document.getElementById(tabName + 'Tab').classList.add('active');
    
    // Add active class to clicked button
    event.target.classList.add('active');
    
    // Load content based on tab
    if (tabName === 'vote') {
        loadPolls();
    } else if (tabName === 'results') {
        loadResults();
    }
}

// API Functions
async function apiCall(endpoint, method = 'GET', data = null) {
    try {
        const options = {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };
        
        if (data) {
            options.body = JSON.stringify(data);
        }
        
        const response = await fetch(`/api${endpoint}`, options);
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Request failed');
        }
        
        return await response.json();
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// Load and display polls
async function loadPolls() {
    const pollsList = document.getElementById('pollsList');
    pollsList.innerHTML = `<p>${getTranslation('vote.loading')}</p>`;
    
    try {
        const polls = await apiCall('/polls');
        
        if (polls.length === 0) {
            pollsList.innerHTML = '<p>No active polls available.</p>';
            return;
        }
        
        pollsList.innerHTML = polls.map(poll => `
            <div class="poll-item">
                <div class="poll-question">${escapeHtml(poll.question)}</div>
                <div class="poll-meta">
                    Created: ${new Date(poll.createdAt).toLocaleDateString()}
                    ${poll.active ? '• Active' : '• Inactive'}
                </div>
                <button class="vote-btn" onclick="openVoteModal(${poll.id})" ${!poll.active ? 'disabled' : ''}>
                    ${getTranslation('tabs.vote')}
                </button>
            </div>
        `).join('');
    } catch (error) {
        pollsList.innerHTML = `<p>Error loading polls: ${error.message}</p>`;
    }
}

// Load and display results
async function loadResults() {
    const resultsList = document.getElementById('resultsList');
    resultsList.innerHTML = `<p>${getTranslation('results.loading')}</p>`;
    
    try {
        const polls = await apiCall('/polls');
        
        if (polls.length === 0) {
            resultsList.innerHTML = '<p>No polls available.</p>';
            return;
        }
        
        const resultsHtml = await Promise.all(polls.map(async poll => {
            try {
                const results = await apiCall(`/polls/${poll.id}/results`);
                return renderPollResults(results);
            } catch (error) {
                return `<div class="result-item">
                    <div class="result-question">${escapeHtml(poll.question)}</div>
                    <p>Error loading results: ${error.message}</p>
                </div>`;
            }
        }));
        
        resultsList.innerHTML = resultsHtml.join('');
    } catch (error) {
        resultsList.innerHTML = `<p>Error loading results: ${error.message}</p>`;
    }
}

// Render poll results
function renderPollResults(data) {
    const { poll, results, totalVotes } = data;
    
    const maxVotes = Math.max(...Object.values(results));
    
    const optionsHtml = poll.options.map(option => {
        const votes = results[option] || 0;
        const percentage = totalVotes > 0 ? (votes / totalVotes * 100).toFixed(1) : 0;
        const barWidth = maxVotes > 0 ? (votes / maxVotes * 100) : 0;
        
        return `
            <div class="result-option">
                <div style="flex: 1;">
                    <strong>${escapeHtml(option)}</strong>
                    <div class="result-bar">
                        <div class="result-fill" style="width: ${barWidth}%"></div>
                    </div>
                </div>
                <div style="margin-left: 1rem;">
                    ${votes} (${percentage}%)
                </div>
            </div>
        `;
    }).join('');
    
    return `
        <div class="result-item">
            <div class="result-question">${escapeHtml(poll.question)}</div>
            <div class="result-stats">
                <strong>${getTranslation('results.totalVotes')} ${totalVotes}</strong>
            </div>
            ${optionsHtml}
        </div>
    `;
}

// Modal functions
function openVoteModal(pollId) {
    currentPoll = pollId;
    const modal = document.getElementById('voteModal');
    loadPollForVoting(pollId);
    modal.style.display = 'block';
}

function closeModal() {
    const modal = document.getElementById('voteModal');
    modal.style.display = 'none';
    currentPoll = null;
}

async function loadPollForVoting(pollId) {
    try {
        const poll = await apiCall(`/polls/${pollId}`);
        
        document.getElementById('modalTitle').textContent = poll.question;
        
        const voteOptions = document.getElementById('voteOptions');
        voteOptions.innerHTML = poll.options.map((option, index) => `
            <label class="vote-option">
                <input type="radio" name="voteOption" value="${escapeHtml(option)}" id="option${index}">
                ${escapeHtml(option)}
            </label>
        `).join('');
    } catch (error) {
        alert(`Error loading poll: ${error.message}`);
        closeModal();
    }
}

// Form handlers
document.addEventListener('DOMContentLoaded', function() {
    // Create Poll Form
    const createPollForm = document.getElementById('createPollForm');
    createPollForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const question = document.getElementById('pollQuestion').value.trim();
        const optionInputs = document.querySelectorAll('input[name="option"]');
        const options = Array.from(optionInputs)
            .map(input => input.value.trim())
            .filter(option => option.length > 0);
        
        if (!question) {
            alert('Please enter a question');
            return;
        }
        
        if (options.length < 2) {
            alert('Please provide at least 2 options');
            return;
        }
        
        try {
            await apiCall('/polls', 'POST', {
                question: question,
                options: options,
                languages: {
                    en: question
                }
            });
            
            alert(getTranslation('admin.success'));
            createPollForm.reset();
            resetOptionsToDefault();
            loadPolls(); // Refresh polls if on vote tab
        } catch (error) {
            alert(`${getTranslation('admin.error')}: ${error.message}`);
        }
    });
    
    // Vote Form
    const voteForm = document.getElementById('voteForm');
    voteForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const selectedOption = document.querySelector('input[name="voteOption"]:checked');
        if (!selectedOption) {
            alert('Please select an option');
            return;
        }
        
        const voterId = document.getElementById('voterId').value.trim();
        
        try {
            await apiCall(`/polls/${currentPoll}/vote`, 'POST', {
                option: selectedOption.value,
                voterId: voterId || undefined
            });
            
            alert(getTranslation('vote.success'));
            closeModal();
            loadResults(); // Refresh results
        } catch (error) {
            if (error.message.includes('already voted')) {
                alert(getTranslation('vote.already'));
            } else {
                alert(`${getTranslation('vote.error')}: ${error.message}`);
            }
        }
    });
    
    // Load initial data
    loadPolls();
});

// Option management for poll creation
function addOption() {
    const optionsList = document.getElementById('optionsList');
    const optionCount = optionsList.children.length;
    
    const newOption = document.createElement('div');
    newOption.className = 'option-input';
    newOption.innerHTML = `
        <input type="text" name="option" placeholder="Option ${optionCount + 1}" required>
        <button type="button" onclick="removeOption(this)" class="remove-btn">Remove</button>
    `;
    
    optionsList.appendChild(newOption);
    updatePlaceholders(currentLanguage);
}

function removeOption(button) {
    const optionsList = document.getElementById('optionsList');
    if (optionsList.children.length > 2) {
        button.parentElement.remove();
        
        // Update placeholders
        const inputs = optionsList.querySelectorAll('input[name="option"]');
        inputs.forEach((input, index) => {
            const placeholderBase = currentLanguage === 'de' ? 'Option' : 
                                   currentLanguage === 'fr' ? 'Option' : 'Option';
            input.placeholder = `${placeholderBase} ${index + 1}`;
        });
    }
}

function resetOptionsToDefault() {
    const optionsList = document.getElementById('optionsList');
    optionsList.innerHTML = `
        <div class="option-input">
            <input type="text" name="option" placeholder="Option 1" required>
            <button type="button" onclick="removeOption(this)" class="remove-btn">Remove</button>
        </div>
        <div class="option-input">
            <input type="text" name="option" placeholder="Option 2" required>
            <button type="button" onclick="removeOption(this)" class="remove-btn">Remove</button>
        </div>
    `;
    updatePlaceholders(currentLanguage);
}

// Utility functions
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('voteModal');
    if (event.target === modal) {
        closeModal();
    }
}

// Keyboard accessibility
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeModal();
    }
});