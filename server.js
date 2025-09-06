
import pkg from 'pg';
const { Pool } = pkg;

import express from "express";
import multer from "multer";
import fs from "fs";
import { AssemblyAI } from "assemblyai";
import fetch from "node-fetch";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors({
	origin: '*',
	methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
	allowedHeaders: ['Content-Type', 'Authorization'],
}));
const upload = multer({ dest: "uploads/" });

const assemblyaiApiKey = process.env.ASSEMBLYAI_API_KEY;
const client = new AssemblyAI({ apiKey: assemblyaiApiKey });

// Gemini API endpoint e chave
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

app.use(express.json());

// Configuração do pool do Postgres
const pool = new Pool({
	user: process.env.DB_USER,
	host: process.env.DB_HOST,
	database: process.env.DB_NAME,
	password: process.env.DB_PASSWORD,
	port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432,
});

app.post("/analisar", async (req, res) => {
	try {
		// Recebe dados da análise já processados pelo front
		const { transcript, wordsPerMinute, lowConfidenceRate, muletas } = req.body;
		if (!transcript || wordsPerMinute === undefined || lowConfidenceRate === undefined || muletas === undefined) {
			return res.status(400).json({ error: "Dados insuficientes para diagnóstico." });
		}

		// Monta prompt para Gemini
		const prompt = `Você é um especialista em comunicação e oratória.\nAvalie a fala de uma pessoa com base nestes dados:\n\n- Transcrição: ${transcript}\n- Velocidade (palavras por minuto): ${wordsPerMinute}\n- Taxa de clareza (palavras com baixa confiança): ${lowConfidenceRate}\n- Número de muletas detectadas: ${muletas}\n\nDiagnostique os principais problemas de comunicação e sugira como a pessoa pode melhorar.`;

		// Chama Gemini
		const geminiRes = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
		});
		const geminiData = await geminiRes.json();

		// Retorna apenas o diagnóstico Gemini
		res.json({ gemini: geminiData });
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});



// CRUD OBJETIVOS (nome, descricao)
app.get('/objetivos', async (req, res) => {
	try {
		const result = await pool.query('SELECT * FROM objetivos');
		res.json(result.rows);
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});
app.post('/objetivos', async (req, res) => {
	const { nome, descricao } = req.body;
	try {
		const result = await pool.query('INSERT INTO objetivos (nome, descricao) VALUES ($1, $2) RETURNING *', [nome, descricao]);
		res.status(201).json(result.rows[0]);
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});
app.put('/objetivos/:id', async (req, res) => {
	const { id } = req.params;
	const { nome, descricao } = req.body;
	try {
		const result = await pool.query('UPDATE objetivos SET nome=$1, descricao=$2 WHERE id=$3 RETURNING *', [nome, descricao, id]);
		res.json(result.rows[0]);
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});
app.delete('/objetivos/:id', async (req, res) => {
	const { id } = req.params;
	try {
		await pool.query('DELETE FROM objetivos WHERE id=$1', [id]);
		res.json({ success: true });
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});


// CRUD METODOS (nome, descricao, prompt, criteriosAvaliativos, idDoObjetivo)
app.get('/metodos', async (req, res) => {
	try {
		const result = await pool.query('SELECT * FROM metodos');
		res.json(result.rows);
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});
app.post('/metodos', async (req, res) => {
	const { nome, descricao, prompt, criteriosAvaliativos, idDoObjetivo } = req.body;
	try {
		const result = await pool.query(
			'INSERT INTO metodos (nome, descricao, prompt, criteriosAvaliativos, idDoObjetivo) VALUES ($1, $2, $3, $4, $5) RETURNING *',
			[nome, descricao, prompt, criteriosAvaliativos, idDoObjetivo]
		);
		res.status(201).json(result.rows[0]);
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});
app.put('/metodos/:id', async (req, res) => {
	const { id } = req.params;
	const { nome, descricao, prompt, criteriosAvaliativos, idDoObjetivo } = req.body;
	try {
		const result = await pool.query(
			'UPDATE metodos SET nome=$1, descricao=$2, prompt=$3, criteriosAvaliativos=$4, idDoObjetivo=$5 WHERE id=$6 RETURNING *',
			[nome, descricao, prompt, criteriosAvaliativos, idDoObjetivo, id]
		);
		res.json(result.rows[0]);
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});
app.delete('/metodos/:id', async (req, res) => {
	const { id } = req.params;
	try {
		await pool.query('DELETE FROM metodos WHERE id=$1', [id]);
		res.json({ success: true });
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});


// CRUD USUARIOS (nome, email, sobre, senha, dataNascimento, telefone, perfil)
app.get('/usuarios', async (req, res) => {
	try {
		const result = await pool.query('SELECT * FROM usuarios');
		res.json(result.rows);
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});
app.post('/usuarios', async (req, res) => {
	const { nome, email, sobre, senha, dataNascimento, telefone, perfil } = req.body;
	try {
		const result = await pool.query(
			'INSERT INTO usuarios (nome, email, sobre, senha, dataNascimento, telefone, perfil) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
			[nome, email, sobre, senha, dataNascimento, telefone, perfil]
		);
		res.status(201).json(result.rows[0]);
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});
app.put('/usuarios/:id', async (req, res) => {
	const { id } = req.params;
	const { nome, email, sobre, senha, dataNascimento, telefone, perfil } = req.body;
	try {
		const result = await pool.query(
			'UPDATE usuarios SET nome=$1, email=$2, sobre=$3, senha=$4, dataNascimento=$5, telefone=$6, perfil=$7 WHERE id=$8 RETURNING *',
			[nome, email, sobre, senha, dataNascimento, telefone, perfil, id]
		);
		res.json(result.rows[0]);
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

app.patch('/usuarios/sobre/:id', async (req, res) => {
  const { id } = req.params;
  const { sobre } = req.body;
  try {
    const result = await pool.query(
      'UPDATE usuarios SET sobre=$1 WHERE id=$2 RETURNING *',
      [sobre, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


app.delete('/usuarios/:id', async (req, res) => {
	const { id } = req.params;
	try {
		await pool.query('DELETE FROM usuarios WHERE id=$1', [id]);
		res.json({ success: true });
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

// Endpoint de login: verifica usuário por email ou telefone e senha
app.post('/login', async (req, res) => {
	const { login, senha } = req.body;
	if (!login || !senha) {
		return res.status(400).json({ error: 'Login (email ou telefone) e senha são obrigatórios.' });
	}
	try {
		const result = await pool.query(
			'SELECT * FROM usuarios WHERE (email = $1 OR telefone = $1) AND senha = $2',
			[login, senha]
		);
		if (result.rows.length > 0) {
			// Não retornar a senha
			const user = { ...result.rows[0] };
			delete user.senha;
			res.json({ success: true, usuario: user });
		} else {
			res.status(401).json({ success: false, error: 'Usuário ou senha inválidos.' });
		}
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});


// Novo endpoint: recebe áudio, envia para AssemblyAI, depois Gemini, retorna diagnóstico e transcrição

app.post('/diagnostico', upload.single('audio'), async (req, res) => {
	console.log('Recebida requisição em /diagnostico');
	try {
		const usuarioId = req.body.usuarioId || req.body['usuarioId'] || req.body.get?.('usuarioId');
		if (!req.file) {
			console.error('Nenhum arquivo recebido');
			return res.status(400).json({ error: 'Arquivo de áudio não enviado.' });
		}
		if (!usuarioId) {
			fs.unlink(req.file.path, () => {});
			return res.status(400).json({ error: 'usuarioId não enviado.' });
		}
		console.log('Arquivo recebido:', req.file.originalname, req.file.mimetype, req.file.size);

		// 1. Upload do áudio para AssemblyAI
		let uploadData;
		try {
			const audioStream = fs.createReadStream(req.file.path);
			const uploadRes = await fetch('https://api.assemblyai.com/v2/upload', {
				method: 'POST',
				headers: { 'authorization': assemblyaiApiKey },
				body: audioStream
			});
			uploadData = await uploadRes.json();
			if (!uploadData.upload_url) throw new Error('AssemblyAI upload falhou: ' + JSON.stringify(uploadData));
			console.log('Upload AssemblyAI OK');
		} catch (e) {
			console.error('Erro no upload AssemblyAI:', e);
			fs.unlink(req.file.path, () => {});
			return res.status(500).json({ error: 'Falha ao enviar áudio para AssemblyAI.' });
		}

		// 2. Solicitar transcrição
		const muletas = ["tipo", "ééé", "né", "então", "daí", "tá", "hum", "ah", "bom", "certo", "ok"];
		let transcriptData;
		try {
			const transcriptRes = await fetch('https://api.assemblyai.com/v2/transcript', {
				method: 'POST',
				headers: {
					'authorization': assemblyaiApiKey,
					'content-type': 'application/json'
				},
				body: JSON.stringify({
					audio_url: uploadData.upload_url,
					speech_model: 'universal',
					language_code: 'pt',
					punctuate: true,
					format_text: true,
					word_boost: muletas,
				})
			});
			transcriptData = await transcriptRes.json();
			if (!transcriptData.id) throw new Error('AssemblyAI transcript falhou: ' + JSON.stringify(transcriptData));
			console.log('Transcrição AssemblyAI requisitada, id:', transcriptData.id);
		} catch (e) {
			console.error('Erro ao solicitar transcrição:', e);
			fs.unlink(req.file.path, () => {});
			return res.status(500).json({ error: 'Falha ao solicitar transcrição.' });
		}

		// 3. Polling para resultado
		let completed = false;
		let pollData;
		let tentativas = 0;
		try {
			while (!completed && tentativas < 30) { // timeout após ~90s
				await new Promise(r => setTimeout(r, 3000));
				tentativas++;
				const pollRes = await fetch(`https://api.assemblyai.com/v2/transcript/${transcriptData.id}`, {
					headers: { 'authorization': assemblyaiApiKey }
				});
				pollData = await pollRes.json();
				if (pollData.status === 'completed') {
					completed = true;
				} else if (pollData.status === 'failed') {
					completed = true;
					throw new Error('Falha na transcrição: ' + JSON.stringify(pollData));
				}
			}
			if (!completed) throw new Error('Timeout esperando transcrição.');
			console.log('Transcrição AssemblyAI concluída.');
		} catch (e) {
			console.error('Erro no polling da transcrição:', e);
			fs.unlink(req.file.path, () => {});
			return res.status(500).json({ error: 'Falha ao obter transcrição.' });
		}

		// Análise de muletas
		let muletasEncontradas = [];
		muletas.forEach(m => {
			const regex = new RegExp(`\\b${m}\\b`, 'gi');
			const count = (pollData.text && pollData.text.match(regex) || []).length;
			if (count > 0) muletasEncontradas.push(`${m}: ${count}`);
		});

		// Velocidade e pausas
		let wpm = 0;
		if (pollData.words && pollData.words.length > 0) {
			let totalWords = pollData.words.length;
			let startTime = pollData.words[0]?.start || 0;
			let endTime = pollData.words[totalWords-1]?.end || 0;
			let durationSec = (endTime - startTime) / 1000;
			wpm = durationSec > 0 ? Math.round((totalWords / durationSec) * 60) : 0;
		}

		// Dados para Gemini
		const lastAnalysis = {
			transcript: pollData.text,
			wordsPerMinute: wpm || 0,
			lowConfidenceRate: pollData.words && pollData.words.length > 0 ? ((pollData.words.filter(w => w.confidence < 0.6).length / pollData.words.length) * 100).toFixed(1) : 0,
			muletas: muletasEncontradas.length ? muletasEncontradas.length : 0
		};

		// Prompt Gemini
		const prompt = `Você é um especialista em comunicação e oratória.\nAvalie a fala de uma pessoa com base nestes dados:\n\n- Transcrição: ${lastAnalysis.transcript}\n- Velocidade (palavras por minuto): ${lastAnalysis.wordsPerMinute}\n- Taxa de clareza (palavras com baixa confiança): ${lastAnalysis.lowConfidenceRate}\n- Número de muletas detectadas: ${lastAnalysis.muletas}\n\nDiagnostique os principais problemas de comunicação e sugira como a pessoa pode melhorar.`;

		// Chama Gemini
		let geminiData;
		let diagnosticoMsg = '';
		try {
			const geminiRes = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ contents: [ { parts: [ { text: prompt } ] } ] })
			});
			geminiData = await geminiRes.json();
			if (!geminiData.candidates) throw new Error('Gemini não respondeu: ' + JSON.stringify(geminiData));
			console.log('Diagnóstico Gemini recebido.');
			diagnosticoMsg = geminiData.candidates[0]?.content?.parts[0]?.text || 'Não foi possível obter resposta da IA.';
		} catch (e) {
			console.error('Erro ao consultar Gemini:', e);
			diagnosticoMsg = 'Diagnóstico indisponível: ' + (e.message.includes('API key not valid') ? 'API KEY inválida ou quota esgotada.' : 'Falha ao consultar Gemini.');
		}

		// Atualiza o campo sobre do usuário
		try {
			// Busca o sobre atual
			const userResult = await pool.query('SELECT sobre FROM usuarios WHERE id = $1', [usuarioId]);
			let sobreAtual = userResult.rows[0]?.sobre || '';
			// Adiciona a apresentação
			sobreAtual = sobreAtual.trim();
			if (sobreAtual && !sobreAtual.endsWith('\n')) sobreAtual += '\n';
			sobreAtual += `###Apresentacao\n${lastAnalysis.transcript}`;
			await pool.query('UPDATE usuarios SET sobre = $1 WHERE id = $2', [sobreAtual, usuarioId]);
		} catch (e) {
			console.error('Erro ao atualizar o campo sobre do usuário:', e);
			// Não retorna erro para o usuário final, apenas loga
		}

		// Limpa arquivo temporário
		fs.unlink(req.file.path, () => {});

		// Retorna diagnóstico e transcrição (sempre retorna transcrição)
		res.json({
			transcricao: pollData.text,
			diagnostico: diagnosticoMsg
		});
	} catch (err) {
		console.error('Erro inesperado:', err);
		if (req.file) fs.unlink(req.file.path, () => {});
		res.status(500).json({ error: err.message });
	}
});

const PORT = process.env.PORT || 3331;
app.listen(PORT, () => {
	console.log(`Servidor rodando na porta ${PORT}`);
});
