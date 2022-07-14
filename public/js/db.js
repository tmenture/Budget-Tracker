// This variable holds the database connection
let db;

// Establishes connection with indexedDB with the name budget_tracker with its version set to 1
const request = indexedDB.open('budget_tracker', 1);

// Event that with fire if database version changes
request.onupgradeneeded = function (event) {
    // Saves a reference to the db
    const db = event.target.result;

    // Starts the object sore table with the name new_transaction, with an autoincrementing primary key for tracking
    db.createObjectStore('new_transaction', { autoIncrement: true });
};

// Fires on successfull request
request.onsuccess = function (event) {
    // When created successfuly, save a reference to db in global variable
    db = event.target.result;

    // Checks if app is online, if yes fire upload transaction to send the local data 
    if (navigator.online) {
        uploadTransaction();
    }
};

// Logs error 
request.onerror = function (event) {
    console.log(event.target.errorCode);
};

// Event that will fire when disconnected from internet
function saveRecord (record) {
    //
    const transaction = db.transaction(['new_transaction'], 'readwrite');

    //
    const budgetObjectStore = transaction.objectStore('new_transaction');

    //
    budgetObjectStore.add(record);
}

// Function that uploads the changes made while offline 
function uploadTransaction () {
    // Opens a transaction
    const transaction = db.transaction(['new_transaction'], 'readwrite');

    // Accesses the object store
    const budgetObjectStore = transaction.objectStore('new_transaction');

    // Aquires all records from the store and sets them to the variable
    const getAll = budgetObjectStore.getAll();

    // Sends the data from store to the api server
    getAll.onsuccess = function () {
        if (getAll.result.length > 0) {
            fetch('/api/transaction', {
                method: 'POST',
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: 'application/json, text/plain, */*',
                    'Content-Type': 'application/json'
                }
            }).then(response => response.json())
            .then(serverResponse => {
                if (serverResponse.message) {
                    throw new Error(serverResponse);
                }

                // Opens a transaction
                const transaction = db.transaction(['new_transaction'], 'readwrite');

                // Accesses the store
                const budgetObjectStore = transaction.objectStore('new_transaction');

                // Clears all the old transactions from the store
                budgetObjectStore.clear();

                alert('All saved transactions have been submitted!');
            }).catch(err => {
                console.log(err);
            });
        }
    }
}

// Listens for the app to come back online
window.addEventListener('online', uploadTransaction);