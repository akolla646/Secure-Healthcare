import { Users, FileText, AlertTriangle, CheckCircle, Search } from 'lucide-react';

const AdminDashboard = () => {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {/* Stat Cards */}
                <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <Users className="h-6 w-6 text-slate-400" />
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="text-sm font-medium text-slate-500 truncate">Total Users</dt>
                                    <dd className="text-lg font-medium text-slate-900">42</dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                    <div className="bg-slate-50 px-5 py-3">
                        <div className="text-sm">
                            <a href="#" className="font-medium text-teal-600 hover:text-teal-900">View all</a>
                        </div>
                    </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <FileText className="h-6 w-6 text-slate-400" />
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="text-sm font-medium text-slate-500 truncate">Audit Logs (24h)</dt>
                                    <dd className="text-lg font-medium text-slate-900">156</dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                    <div className="bg-slate-50 px-5 py-3">
                        <div className="text-sm">
                            <a href="#" className="font-medium text-teal-600 hover:text-teal-900">View logs</a>
                        </div>
                    </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <CheckCircle className="h-6 w-6 text-green-400" />
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="text-sm font-medium text-slate-500 truncate">System Status</dt>
                                    <dd className="text-lg font-medium text-green-600">Compliant</dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                    <div className="bg-slate-50 px-5 py-3">
                        <div className="text-sm text-slate-500">Last check: 2 mins ago</div>
                    </div>
                </div>
            </div>

            {/* Recent Audit Log Table */}
            <div className="bg-white shadow sm:rounded-lg">
                <div className="px-4 py-5 sm:px-6 flex justify-between items-center border-b border-slate-200">
                    <h3 className="text-lg leading-6 font-medium text-slate-900">Security Audit Logs</h3>
                    <div className="relative">
                        <input type="text" placeholder="Search logs..." className="pl-8 pr-3 py-1 border border-slate-300 rounded-md text-sm focus:ring-teal-500 focus:border-teal-500" />
                        <Search className="h-4 w-4 text-slate-400 absolute left-2.5 top-2" />
                    </div>
                </div>
                <ul className="divide-y divide-slate-200">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <li key={i} className="px-4 py-4 sm:px-6 hover:bg-slate-50 transition-colors">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <AlertTriangle className={`h-5 w-5 mr-3 ${i === 1 ? 'text-yellow-500' : 'text-slate-400'}`} />
                                    <div>
                                        <p className="text-sm font-medium text-slate-900">
                                            {i === 1 ? 'Failed Login Attempt' : 'Record Accessed (Read)'}
                                        </p>
                                        <div className="flex text-xs text-slate-500 mt-0.5">
                                            <span className="mr-2">User: {i === 1 ? 'Unknown' : 'dr.sarah'}</span>
                                            <span>• IP: 192.168.1.{100 + i}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-sm text-slate-500">
                                    {i * 12} mins ago
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default AdminDashboard;
