import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API from "../utils/api";
import { Folder, CheckCircle, Clock, Users, ArrowRight, Plus } from "lucide-react";

const Dashboard = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await API.get("/projects");
        setProjects(response.data.projects || []);
      } catch (error) {
        console.error("Error fetching projects:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, []);

  return (
    <div className="space-y-8 max-w-7xl mx-auto w-full">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Dashboard</h1>
          <p className="text-slate-500 mt-1">
            Track, manage, and collaborate on your team's projects.
          </p>
        </div>
        <Link
          to="/projects"
          className="inline-flex items-center px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition-all duration-150 shadow-sm cursor-pointer"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Project
        </Link>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { name: "Total Projects", value: projects.length, icon: Folder, color: "text-blue-600 bg-blue-50" },
          { name: "Completed Tasks", value: "0", icon: CheckCircle, color: "text-emerald-600 bg-emerald-50" },
          { name: "Pending Deadlines", value: "0", icon: Clock, color: "text-amber-600 bg-amber-50" },
          { name: "Collaborators", value: "1", icon: Users, color: "text-indigo-600 bg-indigo-50" },
        ].map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div
              key={idx}
              className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between"
            >
              <div>
                <p className="text-sm font-medium text-slate-500">{stat.name}</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-xl ${stat.color}`}>
                <Icon className="w-6 h-6" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Projects Grid Section */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-slate-950">Active Projects</h2>
          <Link
            to="/projects"
            className="text-indigo-600 hover:text-indigo-500 font-semibold text-sm flex items-center transition-all"
          >
            View all projects
            <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </div>

        {loading ? (
          <div className="py-12 flex justify-center items-center">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : projects.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
              <Folder className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">No projects yet</h3>
            <p className="text-slate-500 mt-1 max-w-sm mx-auto">
              Get started by creating your first project space to build tasks and coordinate with teams.
            </p>
            <Link
              to="/projects"
              className="inline-flex items-center px-4 py-2 mt-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition-all shadow-sm"
            >
              Create Project
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {projects.slice(0, 3).map((project) => (
              <div
                key={project.id}
                className="group border border-slate-200 rounded-xl p-5 hover:border-indigo-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <h3 className="font-bold text-slate-900 text-lg group-hover:text-indigo-600 transition-colors">
                    {project.name}
                  </h3>
                  <p className="text-slate-500 text-sm mt-2 line-clamp-2 min-h-[40px]">
                    {project.description || "No description provided."}
                  </p>
                </div>
                <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                  <span>Created {new Date(project.createdAt).toLocaleDateString()}</span>
                  <span className="font-semibold text-slate-600">
                    {project.members?.length || 1} {project.members?.length === 1 ? "Member" : "Members"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
