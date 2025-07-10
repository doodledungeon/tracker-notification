export function loadTasks(dateString) {
  const data = localStorage.getItem('tasks-' + dateString);
  return data ? JSON.parse(data) : [];
}
 
export function saveTasks(dateString, tasks) {
  localStorage.setItem('tasks-' + dateString, JSON.stringify(tasks));
} 