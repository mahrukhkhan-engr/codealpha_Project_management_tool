import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import API from "../utils/api";
import {
  Plus,
  X,
  AlertCircle,
  Folder,
  UserPlus,
  Users,
  ChevronLeft,
  Calendar,
  AlertOctagon,
} from "lucide-react";

const ProjectDetails = () => {
  const { id: projectId } = useParams();
  const [project, setProject] = useState(null);
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals / Inputs
  const [columnModalOpen, setColumnModalOpen] = useState(false);
  const [columnName, setColumnName] = useState("");
  const [columnError, setColumnError] = useState("");
  const [columnSubmitting, setColumnSubmitting] = useState(false);

  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [activeBoardId, setActiveBoardId] = useState("");
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDesc, setTaskDesc] = useState("");
  const [taskPriority, setTaskPriority] = useState("MEDIUM");
  const [taskError, setTaskError] = useState("");
  const [taskSubmitting, setTaskSubmitting] = useState(false);

  const [memberModalOpen, setMemberModalOpen] = useState(false);
  const [memberEmail, setMemberEmail] = useState("");
  const [memberRole, setMemberRole] = useState("MEMBER");
  const [memberError, setMemberError] = useState("");
  const [memberSubmitting, setMemberSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch boards & tasks
      const boardsRes = await API.get(`/boards/project/${projectId}`);
      setBoards(boardsRes.data.boards || []);

      // Fetch projects to find the matching project details
      const projectsRes = await API.get("/projects");
      const matchedProject = projectsRes.data.projects.find((p) => p.id === projectId);
      setProject(matchedProject);
    } catch (err) {
      console.error("Error loading project workspace:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [projectId]);

  const handleCreateColumn = async (e) => {
    e.preventDefault();
    if (!columnName.trim()) return;

    setColumnError("");
    setColumnSubmitting(true);

    try {
      const response = await API.post("/boards", {
        name: columnName,
        projectId,
      });
      setBoards([...boards, { ...response.data.board, tasks: [] }]);
      setColumnName("");
      setColumnModalOpen(false);
    } catch (err) {
      setColumnError(err.response?.data?.message || "Failed to create board column.");
    } finally {
      setColumnSubmitting(false);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!taskTitle.trim() || !activeBoardId) return;

    setTaskError("");
    setTaskSubmitting(true);

    try {
      const response = await API.post("/tasks", {
        title: taskTitle,
        description: taskDesc,
        priority: taskPriority,
        boardId: activeBoardId,
      });

      // Update local state to inject new task into board
      setBoards(
        boards.map((b) => {
          if (b.id === activeBoardId) {
            return {
              ...b,
              tasks: [...b.tasks, response.data.task],
            };
          }
          return b;
        })
      );

      setTaskTitle("");
      setTaskDesc("");
      setTaskPriority("MEDIUM");
      setTaskModalOpen(false);
    } catch (err) {
      setTaskError(err.response?.data?.message || "Failed to create task card.");
    } finally {
      setTaskSubmitting(false);
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!memberEmail.trim()) return;

    setMemberError("");
    setMemberSubmitting(true);

    try {
      await API.post(`/projects/${projectId}/members`, {
        email: memberEmail,
        role: memberRole,
      });
      // Refresh project member count/info
      fetchData();
      setMemberEmail("");
      setMemberModalOpen(false);
    } catch (err) {
      setMemberError(err.response?.data?.message || "Failed to add member to project.");
    } finally {
      setMemberSubmitting(false);
    }
  };

  const getPriorityBadgeClass = (priority) => {
    switch (priority) {
      case "URGENT":
        return "bg-rose-50 text-rose-700 border-rose-200";
      case "HIGH":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "MEDIUM":
        return "bg-indigo-50 text-indigo-700 border-indigo-200";
      default:
        return "bg-slate-50 text-slate-600 border-slate-200";
    }
  };

  // Determine column color dynamically based on column indexes
  const getColumnColor = (index) => {
    const colors = [
      { border: "border-t-blue-500", dot: "bg-blue-500", bg: "bg-blue-50/40" },
      { border: "border-t-amber-500", dot: "bg-amber-500", bg: "bg-amber-50/40" },
      { border: "border-t-purple-500", dot: "bg-purple-500", bg: "bg-purple-50/40" },
      { border: "border-t-emerald-500", dot: "bg-emerald-500", bg: "bg-emerald-50/40" },
    ];
    return colors[index % colors.length];
  };

  return (
    <div className="space-y-8 flex flex-col h-full w-full max-w-7xl mx-auto">
      {/* Header Back/Nav */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center space-x-3">
          <Link
            to="/projects"
            className="p-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-600 hover:text-slate-900 transition-all shadow-sm"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center space-x-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              <span>Project Space</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mt-1">
              {project?.name || "Kanban Board"}
            </h1>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMemberModalOpen(true)}
            className="inline-flex items-center px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-sm font-semibold transition-all shadow-sm cursor-pointer"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Invite Member
          </button>
          <button
            onClick={() => setColumnModalOpen(true)}
            className="inline-flex items-center px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition-all shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Column
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex-1 py-12 flex justify-center items-center">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="flex-1 flex overflow-x-auto gap-6 pb-6 items-start scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
          {boards.length === 0 ? (
            <div className="flex-1 bg-white border border-slate-200 rounded-2xl py-16 text-center shadow-sm max-w-lg mx-auto">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                <Folder className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 font-sans">No columns yet</h3>
              <p className="text-slate-500 mt-1 max-w-xs mx-auto">
                Create columns like "To Do", "In Progress", or "Completed" to group your workflows.
              </p>
              <button
                onClick={() => setColumnModalOpen(true)}
                className="inline-flex items-center px-4 py-2 mt-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition-all shadow-sm cursor-pointer"
              >
                Create Column
              </button>
            </div>
          ) : (
            boards.map((board, idx) => {
              const styles = getColumnColor(idx);
              return (
                <div
                  key={board.id}
                  className={`w-72 sm:w-80 flex-shrink-0 bg-white border border-slate-250/80 rounded-2xl shadow-sm flex flex-col max-h-[70vh] border-t-4 ${styles.border}`}
                >
                  {/* Column Header */}
                  <div className="p-4 flex items-center justify-between border-b border-slate-100 bg-slate-50/50 rounded-t-2xl">
                    <div className="flex items-center space-x-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${styles.dot}`} />
                      <span className="font-bold text-slate-800 text-sm tracking-wide">
                        {board.name}
                      </span>
                      <span className="bg-slate-200/80 text-slate-600 text-xs px-2 py-0.5 rounded-full font-bold">
                        {board.tasks?.length || 0}
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        setActiveBoardId(board.id);
                        setTaskModalOpen(true);
                      }}
                      className="p-1 hover:bg-slate-200 text-slate-500 hover:text-slate-850 rounded-lg transition-colors cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Tasks Container */}
                  <div className="p-4 overflow-y-auto space-y-4 flex-1 scrollbar-none">
                    {board.tasks?.length === 0 ? (
                      <div className="py-8 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50/30">
                        <p className="text-slate-400 text-xs font-semibold">No tasks</p>
                      </div>
                    ) : (
                      board.tasks.map((task) => (
                        <div
                          key={task.id}
                          className="bg-white border border-slate-200 hover:border-slate-350 hover:shadow-sm rounded-xl p-4 transition-all duration-150"
                        >
                          <div className="flex justify-between items-start gap-2">
                            <h4 className="font-bold text-slate-800 text-sm leading-snug">
                              {task.title}
                            </h4>
                          </div>

                          {task.description && (
                            <p className="text-slate-500 text-xs mt-2 line-clamp-2 leading-relaxed">
                              {task.description}
                            </p>
                          )}

                          <div className="flex justify-between items-center mt-4 pt-3 border-t border-slate-100 gap-2">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getPriorityBadgeClass(
                                task.priority
                              )}`}
                            >
                              {task.priority}
                            </span>
                            <div className="flex items-center text-slate-400 gap-1 text-[10px] font-semibold">
                              <Calendar className="w-3 h-3" />
                              <span>
                                {task.dueDate
                                  ? new Date(task.dueDate).toLocaleDateString(undefined, {
                                      month: "short",
                                      day: "numeric",
                                    })
                                  : "No due date"}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* New Column Modal */}
      {columnModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60" onClick={() => setColumnModalOpen(false)} />
          <div className="relative bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-150 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slate-900">Add Column</h2>
              <button
                onClick={() => setColumnModalOpen(false)}
                className="text-slate-400 hover:text-slate-650"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {columnError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center text-red-700 text-sm">
                <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                {columnError}
              </div>
            )}

            <form onSubmit={handleCreateColumn} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Column Name
                </label>
                <input
                  type="text"
                  required
                  value={columnName}
                  onChange={(e) => setColumnName(e.target.value)}
                  placeholder="e.g. To Do, In Progress, In Review"
                  className="block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setColumnModalOpen(false)}
                  className="px-4 py-2 text-slate-500 hover:text-slate-750 hover:bg-slate-50 rounded-xl text-sm font-semibold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={columnSubmitting}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-all shadow-sm cursor-pointer"
                >
                  {columnSubmitting ? "Adding..." : "Add Column"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Task Modal */}
      {taskModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60" onClick={() => setTaskModalOpen(false)} />
          <div className="relative bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-150 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slate-900">Add Task Card</h2>
              <button
                onClick={() => setTaskModalOpen(false)}
                className="text-slate-400 hover:text-slate-650"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {taskError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center text-red-700 text-sm">
                <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                {taskError}
              </div>
            )}

            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Task Title
                </label>
                <input
                  type="text"
                  required
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="e.g. Design Landing Page mockups"
                  className="block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={taskDesc}
                  onChange={(e) => setTaskDesc(e.target.value)}
                  placeholder="Provide context or details about this task..."
                  className="block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Priority
                </label>
                <select
                  value={taskPriority}
                  onChange={(e) => setTaskPriority(e.target.value)}
                  className="block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setTaskModalOpen(false)}
                  className="px-4 py-2 text-slate-500 hover:text-slate-750 hover:bg-slate-50 rounded-xl text-sm font-semibold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={taskSubmitting}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-all shadow-sm cursor-pointer"
                >
                  {taskSubmitting ? "Creating..." : "Create Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invite Member Modal */}
      {memberModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60" onClick={() => setMemberModalOpen(false)} />
          <div className="relative bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-150 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slate-900">Invite Team Member</h2>
              <button
                onClick={() => setMemberModalOpen(false)}
                className="text-slate-400 hover:text-slate-650"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {memberError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center text-red-700 text-sm">
                <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                {memberError}
              </div>
            )}

            <form onSubmit={handleAddMember} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  User Email Address
                </label>
                <input
                  type="email"
                  required
                  value={memberEmail}
                  onChange={(e) => setMemberEmail(e.target.value)}
                  placeholder="colleague@company.com"
                  className="block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Role
                </label>
                <select
                  value={memberRole}
                  onChange={(e) => setMemberRole(e.target.value)}
                  className="block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm"
                >
                  <option value="MEMBER">Member</option>
                  <option value="ADMIN">Admin (can add other members)</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setMemberModalOpen(false)}
                  className="px-4 py-2 text-slate-500 hover:text-slate-750 hover:bg-slate-50 rounded-xl text-sm font-semibold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={memberSubmitting}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-all shadow-sm cursor-pointer"
                >
                  {memberSubmitting ? "Inviting..." : "Send Invite"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDetails;
