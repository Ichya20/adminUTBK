import React, { useState, useEffect } from 'react';
import { db, auth } from './firebase';
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut, setPersistence, browserSessionPersistence } from 'firebase/auth';
import { collection, addDoc, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { Plus, Trash2, BookOpen, Quote, LayoutDashboard, LogOut, Lock, Users } from 'lucide-react';

function App() {
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [activeTab, setActiveTab] = useState('motivation');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // State Form
  const [motivationText, setMotivationText] = useState('');
  const [question, setQuestion] = useState({
    subject: 'PU', question: '', optionA: '', optionB: '', optionC: '', optionD: '', optionE: '', answer: '', explanation: ''
  });

  // Memeriksa Status Autentikasi
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, [auth]);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await setPersistence(auth, browserSessionPersistence);
      
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      alert("Autentikasi gagal. Silakan periksa kembali Email dan Password Anda.");
    }
  };

  const fetchData = async () => {
    if (!user) return;

    setLoading(true);
    setErrorMessage('');
    setData([]);

    try {
      let colName = 'dynamic_questions';

      if (activeTab === 'motivation') {
        colName = 'motivations';
      } else if (activeTab === 'users') {
        colName = 'users';
      }

      const querySnapshot = await getDocs(collection(db, colName));
      const resultData = querySnapshot.docs.map(snapshot => ({
        id: snapshot.id,
        ...snapshot.data()
      }));

      if (activeTab === 'users') {
        resultData.sort((a, b) => {
          const timeA = a.lastLoginAt?.seconds || a.createdAt?.seconds || 0;
          const timeB = b.lastLoginAt?.seconds || b.createdAt?.seconds || 0;
          return timeB - timeA;
        });
      }

      setData(resultData);
    } catch (err) {
      console.error("Gagal mengambil data:", err);
      setData([]);
      setErrorMessage(
        activeTab === 'users'
          ? "Gagal mengambil data user. Pastikan akun admin memiliki role admin dan Firestore Rules sudah mengizinkan admin membaca collection users."
          : "Gagal mengambil data. Silakan cek koneksi atau Firestore Rules."
      );
    }

    setLoading(false);
  };

  useEffect(() => { 
    fetchData(); 
  }, [activeTab, user]);

  const addMotivation = async () => {
    if (!motivationText) return;
    await addDoc(collection(db, 'motivations'), { text: motivationText });
    setMotivationText('');
    fetchData();
  };

  const addQuestion = async () => {
    if (!question.answer) {
        alert("Pilih kunci jawaban yang benar dulu!");
        return;
    }
    await addDoc(collection(db, 'dynamic_questions'), question);
    setQuestion({ subject: 'PU', question: '', optionA: '', optionB: '', optionC: '', optionD: '', optionE: '', answer: '', explanation: '' });
    alert("Data soal berhasil ditambahkan ke sistem.");
    fetchData();
  };

  const deleteItem = async (id) => {
    if(!window.confirm("Apakah Anda yakin ingin menghapus data ini? Tindakan ini tidak dapat dibatalkan.")) return;
    const col = activeTab === 'motivation' ? 'motivations' : 'dynamic_questions';
    await deleteDoc(doc(db, col, id));
    fetchData();
  };

  const formatFirebaseDate = (value) => {
    if (!value) return '-';

    try {
      if (value.seconds) {
        return new Date(value.seconds * 1000).toLocaleString('id-ID', {
          dateStyle: 'medium',
          timeStyle: 'short'
        });
      }

      if (typeof value === 'number') {
        return new Date(value).toLocaleString('id-ID', {
          dateStyle: 'medium',
          timeStyle: 'short'
        });
      }

      return String(value);
    } catch (error) {
      return '-';
    }
  };

  const safeText = (value) => {
    if (value === null || value === undefined || value === '') {
      return '-';
    }

    return value;
  };

  // Tampilan Halaman Login
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 font-sans">
        <div className="bg-white p-10 rounded-3xl shadow-2xl w-full max-w-md">
          <div className="flex flex-col items-center mb-8">
            <div className="bg-green-100 p-4 rounded-2xl mb-4 text-green-600">
              <Lock size={32} />
            </div>
            <h2 className="text-2xl font-bold text-slate-800">Admin Login</h2>
            <p className="text-slate-500 text-sm mt-1">Sistem Manajemen UTBK App</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Email Administrator</label>
              <input 
                type="email" 
                required
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500 transition-all" 
                onChange={(e) => setEmail(e.target.value)} 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Kata Sandi</label>
              <input 
                type="password" 
                required
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500 transition-all" 
                onChange={(e) => setPassword(e.target.value)} 
              />
            </div>
            <button type="submit" className="w-full bg-green-600 text-white p-4 rounded-xl font-bold hover:bg-green-700 transition-all shadow-lg shadow-green-600/20 mt-2">
              Masuk
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-900">
      <div className="w-72 bg-slate-900 text-white p-8 flex flex-col shadow-xl">
        <div className="flex items-center gap-3 mb-12">
          <div className="p-2 bg-green-500 rounded-lg">
            <LayoutDashboard size={24} />
          </div>
          <h1 className="text-xl font-bold tracking-tight">Admin UTBK</h1>
        </div>
        
        <nav className="space-y-3 flex-1">
          <button 
            onClick={() => setActiveTab('motivation')}
            className={`w-full flex items-center gap-3 p-4 rounded-xl transition-all ${activeTab === 'motivation' ? 'bg-green-600 shadow-lg shadow-green-900/20' : 'hover:bg-slate-800 text-slate-400'}`}
          >
            <Quote size={20} /> <span className="font-medium">Motivasi</span>
          </button>
          <button 
            onClick={() => setActiveTab('questions')}
            className={`w-full flex items-center gap-3 p-4 rounded-xl transition-all ${activeTab === 'questions' ? 'bg-green-600 shadow-lg shadow-green-900/20' : 'hover:bg-slate-800 text-slate-400'}`}
          >
            <BookOpen size={20} /> <span className="font-medium">Kelola Soal</span>
          </button>

          <button 
            onClick={() => setActiveTab('users')}
            className={`w-full flex items-center gap-3 p-4 rounded-xl transition-all ${activeTab === 'users' ? 'bg-green-600 shadow-lg shadow-green-900/20' : 'hover:bg-slate-800 text-slate-400'}`}
          >
            <Users size={20} /> <span className="font-medium">Data User</span>
          </button>
        </nav>

        <button 
          onClick={() => signOut(auth)} 
          className="flex items-center gap-3 p-4 text-red-400 hover:bg-red-500/10 rounded-xl transition-all mt-auto"
        >
          <LogOut size={20} /> <span className="font-medium">Keluar</span>
        </button>
      </div>

      <div className="flex-1 p-12 overflow-y-auto">
        {activeTab === 'motivation' ? (
          <div className="max-w-4xl">
            <header className="mb-10">
              <h2 className="text-3xl font-extrabold mb-2">Manajemen Motivasi</h2>
              <p className="text-slate-500">Kelola teks motivasi dinamis yang akan ditampilkan pada aplikasi.</p>
            </header>

            {errorMessage && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl mb-6">
                {errorMessage}
              </div>
            )}

            <div className="flex gap-3 mb-10">
              <input 
                value={motivationText}
                onChange={(e) => setMotivationText(e.target.value)}
                placeholder="Masukkan teks motivasi baru..."
                className="flex-1 p-4 bg-white border border-slate-200 rounded-2xl shadow-sm outline-none focus:ring-2 focus:ring-green-500 transition-all"
              />
              <button onClick={addMotivation} className="bg-green-600 text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-2 hover:bg-green-700 transition-all">
                <Plus size={20} /> Tambah Data
              </button>
            </div>

            <div className="grid gap-4">
              {loading ? <p className="animate-pulse">Memuat...</p> : 
                data.map(item => (
                  <div key={item.id} className="group bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex justify-between items-center hover:border-green-200 transition-all">
                    <p className="text-slate-700 italic">"{item.text}"</p>
                    <button onClick={() => deleteItem(item.id)} className="opacity-0 group-hover:opacity-100 p-2 text-red-500 hover:bg-red-50 rounded-xl transition-all">
                      <Trash2 size={20} />
                    </button>
                  </div>
                ))
              }
            </div>
          </div>
        ) : activeTab === 'users' ? (
          <div className="max-w-7xl">
            <header className="mb-10">
              <h2 className="text-3xl font-extrabold mb-2">Data User Terdaftar</h2>
              <p className="text-slate-500">Pantau akun pengguna yang sudah daftar atau login ke aplikasi UTBK-SNBT.</p>
            </header>

            {errorMessage && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl mb-6">
                {errorMessage}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                <p className="text-sm text-slate-500 font-medium">Total User</p>
                <p className="text-3xl font-extrabold text-slate-900 mt-2">{data.length}</p>
              </div>

              <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                <p className="text-sm text-slate-500 font-medium">Login Google</p>
                <p className="text-3xl font-extrabold text-green-600 mt-2">
                  {data.filter(item => item.provider === 'google').length}
                </p>
              </div>

              <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                <p className="text-sm text-slate-500 font-medium">Login Email</p>
                <p className="text-3xl font-extrabold text-blue-600 mt-2">
                  {data.filter(item => item.provider === 'email_password').length}
                </p>
              </div>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
              {loading ? (
                <p className="p-6 animate-pulse">Memuat data user...</p>
              ) : data.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-slate-500">Belum ada data user.</p>
                  <p className="text-sm text-slate-400 mt-1">Pastikan user sudah login/daftar dan data masuk ke collection users.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-100 text-slate-600 text-sm">
                      <tr>
                        <th className="p-4 font-bold">Nama</th>
                        <th className="p-4 font-bold">Email</th>
                        <th className="p-4 font-bold">Telepon</th>
                        <th className="p-4 font-bold">Tanggal</th>
                        <th className="p-4 font-bold">Provider</th>
                        <th className="p-4 font-bold">Role</th>
                        <th className="p-4 font-bold">Terakhir Login</th>
                        <th className="p-4 font-bold">Tanggal Daftar</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.map(item => (
                        <tr key={item.id} className="border-t border-slate-100 hover:bg-slate-50 transition-all">
                          <td className="p-4 font-semibold text-slate-800">{safeText(item.nama)}</td>
                          <td className="p-4 text-slate-600">{safeText(item.email)}</td>
                          <td className="p-4 text-slate-600">{safeText(item.telepon)}</td>
                          <td className="p-4 text-slate-600">{safeText(item.tanggal)}</td>
                          <td className="p-4">
                            <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-bold">
                              {safeText(item.provider)}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${item.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-700'}`}>
                              {safeText(item.role)}
                            </span>
                          </td>
                          <td className="p-4 text-slate-600">{formatFirebaseDate(item.lastLoginAt)}</td>
                          <td className="p-4 text-slate-600">{formatFirebaseDate(item.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="max-w-5xl">
            <header className="mb-10">
              <h2 className="text-3xl font-extrabold mb-2">Bank Soal Simulasi</h2>
              <p className="text-slate-500">Formulir penambahan soal evaluasi.</p>
            </header>

            {errorMessage && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl mb-6">
                {errorMessage}
              </div>
            )}

            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 grid grid-cols-2 gap-6">
              <div className="col-span-2">
                <label className="block text-sm font-semibold text-slate-600 mb-2 ml-1">Deskripsi / Narasi Soal</label>
                <textarea 
                  value={question.question}
                  onChange={(e) => setQuestion({...question, question: e.target.value})}
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl h-32 focus:ring-2 focus:ring-green-500 outline-none transition-all"
                  placeholder="Masukkan pertanyaan di sini..."
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-2 ml-1">Kategori Mata Uji</label>
                <select 
                  value={question.subject}
                  onChange={(e) => setQuestion({...question, subject: e.target.value})}
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-green-500 outline-none"
                >
                  <option value="PU">Penalaran Umum (PU)</option>
                  <option value="PK">Pengetahuan Kuantitatif (PK)</option>
                  <option value="PPU">Pengetahuan dan Pemahaman Umum (PPU)</option>
                  <option value="PBM">Pemahaman Bacaan dan Menulis (PBM)</option>
                  <option value="PM">Penalaran Matematika (PM)</option>
                  <option value="LIT_BI">Literasi Bahasa Indonesia (LIT_BI)</option>
                  <option value="LIT_EN">Literasi Bahasa Inggris (LIT_EN)</option>
                </select>
              </div>

              {/* --- BAGIAN YANG DIUBAH: DARI INPUT TEKS KE SELECT --- */}
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-2 ml-1">Kunci Jawaban Benar</label>
                <select 
                   value={question.answer} 
                   onChange={(e) => setQuestion({...question, answer: e.target.value})} 
                   className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-green-500 outline-none transition-all"
                >
                  <option value="">-- Pilih Kunci Jawaban --</option>
                  <option value="optionA">Opsi A</option>
                  <option value="optionB">Opsi B</option>
                  <option value="optionC">Opsi C</option>
                  <option value="optionD">Opsi D</option>
                  <option value="optionE">Opsi E</option>
                </select>
              </div>
              {/* -------------------------------------------------- */}

              {['A', 'B', 'C', 'D', 'E'].map(opt => (
                <div key={opt}>
                  <label className="block text-sm font-semibold text-slate-600 mb-2 ml-1">Isi Teks Opsi {opt}</label>
                  <input 
                    value={question[`option${opt}`]} 
                    onChange={(e) => setQuestion({...question, [`option${opt}`]: e.target.value})} 
                    className="w-full p-4 bg-white border border-slate-200 rounded-2xl focus:border-green-400 outline-none transition-all" 
                    placeholder={`Masukkan teks untuk pilihan ${opt}...`}
                  />
                </div>
              ))}

              <div className="col-span-2 mt-2">
                <label className="block text-sm font-semibold text-slate-600 mb-2 ml-1">Penjelasan / Pembahasan Soal</label>
                <textarea 
                  value={question.explanation}
                  onChange={(e) => setQuestion({...question, explanation: e.target.value})}
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl h-32 focus:ring-2 focus:ring-green-500 outline-none transition-all"
                  placeholder="Masukkan cara penyelesaian..."
                />
              </div>

              <div className="col-span-2 pt-6">
                <button onClick={addQuestion} className="w-full bg-slate-900 text-white p-5 rounded-2xl font-bold text-lg hover:bg-slate-800 transition-all">
                  Simpan Soal ke Database
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;