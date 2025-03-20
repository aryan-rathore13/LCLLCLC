document.addEventListener("DOMContentLoaded", () => {
    // CSS Debugging
    const cssLink = document.querySelector('link[href="dist/tailwind.css"]');
    if (!cssLink) {
      console.error("CSS link not found in popup.html");
      alert("CSS link not found - Tailwind styles won't load.");
    } else {
      console.log("CSS link found:", cssLink.href);
      fetch(chrome.runtime.getURL("dist/tailwind.css"))
        .then(response => {
          if (!response.ok) throw new Error(`Failed to load tailwind.css: ${response.status}`);
          console.log("tailwind.css loaded successfully");
          return response.text();
        })
        .then(cssText => {
          if (cssText.length < 1000) console.warn("tailwind.css is suspiciously small - might be empty");
          else console.log("tailwind.css content looks good, size:", cssText.length);
        })
        .catch(err => {
          console.error(err);
          alert("Error loading tailwind.css: " + err.message);
        });
      
      // Check if styles are applied
      const body = document.getElementById("body");
      const computedStyle = window.getComputedStyle(body);
      if (!computedStyle.backgroundImage.includes("linear-gradient")) {
        console.warn("Background gradient not applied - CSS might not be working");
        alert("CSS styles not applied - check console for details.");
      } else {
        console.log("Background gradient applied:", computedStyle.backgroundImage);
      }
    }
  
    const bgSelector = document.getElementById("bgSelector");
    const addListBtn = document.getElementById("addList");
    const listForm = document.getElementById("listForm");
    const saveListBtn = document.getElementById("saveList");
    const listNameInput = document.getElementById("listName");
    const listsContainer = document.getElementById("lists");
    const questionForm = document.getElementById("questionForm");
    const listSelect = document.getElementById("listSelect");
    const daysInput = document.getElementById("days");
    const emailInput = document.getElementById("email");
    const saveReminderBtn = document.getElementById("saveReminder");
  
    let lists = JSON.parse(localStorage.getItem("leetcodeLists")) || {};
  
    const backgrounds = {
      bg1: "bg-gradient-to-br from-gray-900 via-indigo-900 to-purple-900",
      bg2: "bg-gradient-to-br from-teal-900 via-blue-900 to-cyan-800",
      bg3: "bg-gradient-to-br from-pink-900 via-red-900 to-orange-800",
    };
    bgSelector.addEventListener("change", () => {
      body.className = `text-white font-sans min-w-[400px] min-h-[500px] p-6 rounded-lg shadow-2xl transition-colors duration-300 ${backgrounds[bgSelector.value]}`;
    });
    body.className += ` ${backgrounds[bgSelector.value]}`;
  
    addListBtn.addEventListener("click", () => {
      listForm.classList.remove("hidden");
      listForm.classList.add("fade-in");
      addListBtn.classList.add("hidden");
    });
  
    saveListBtn.addEventListener("click", () => {
      const name = listNameInput.value.trim();
      if (!name) {
        alert("Please enter a list name.");
        return;
      }
      if (!lists[name]) lists[name] = [];
      localStorage.setItem("leetcodeLists", JSON.stringify(lists));
      listNameInput.value = "";
      listForm.classList.add("hidden");
      addListBtn.classList.remove("hidden");
      renderLists();
    });
  
    function renderLists() {
      listsContainer.innerHTML = "";
      listSelect.innerHTML = '<option value="">Select a List</option>';
      for (const [name, questions] of Object.entries(lists)) {
        const div = document.createElement("div");
        div.className = "bg-gray-800 p-4 rounded-lg";
        div.innerHTML = `
          <div class="flex justify-between items-center">
            <h2 class="text-lg font-semibold text-indigo-200">${name} (${questions.length})</h2>
            <button class="addQuestion text-sm bg-blue-600 hover:bg-blue-700 text-white py-1 px-3 rounded-md" data-list="${name}">Add Question</button>
          </div>
          <ul class="mt-2 space-y-1">${questions.map(q => `<li class="text-gray-300">${q.question}</li>`).join("")}</ul>
        `;
        listsContainer.appendChild(div);
        listSelect.innerHTML += `<option value="${name}">${name}</option>`;
      }
      document.querySelectorAll(".addQuestion").forEach(btn => {
        btn.addEventListener("click", () => {
          questionForm.classList.remove("hidden");
          questionForm.classList.add("fade-in");
          listSelect.value = btn.dataset.list;
        });
      });
    }
    renderLists();
  
    saveReminderBtn.addEventListener("click", () => {
      const days = parseInt(daysInput.value);
      const email = emailInput.value;
      const listName = listSelect.value;
      if (days < 1 || isNaN(days)) return alert("Please enter a valid number of days.");
      if (!email || !email.includes("@")) return alert("Please enter a valid email.");
      if (!listName) return alert("Please select a list.");
  
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const url = tabs[0].url;
        if (!url.includes("leetcode.com/problems")) {
          alert("This works only on LeetCode problem pages.");
          return;
        }
  
        const question = url.split("/").pop().replace(/\/$/, "");
        lists[listName].push({ question, url });
        localStorage.setItem("leetcodeLists", JSON.stringify(lists));
        renderLists();
  
        const reminderTime = new Date();
        reminderTime.setDate(reminderTime.getDate() + days);
  
        fetch("http://localhost:3000/add-reminder", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            questions: lists[listName],
            time: reminderTime.toISOString(),
            email,
          }),
        })
          .then(res => res.json())
          .then(data => {
            if (data.success) {
              alert("Reminder set successfully!");
              questionForm.classList.add("hidden");
              daysInput.value = "";
              emailInput.value = "";
            } else {
              throw new Error(data.message || "Failed to set reminder");
            }
          })
          .catch(err => alert("Error setting reminder: " + err));
      });
    });
  });