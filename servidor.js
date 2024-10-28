import express from 'express'
import path from 'path'
import aws from 'aws-sdk'
import axios from 'axios'

const app = express();
const __dirname = path.resolve();

app.use(express.static(path.join(__dirname, 'static')));
app.use(express.json());

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'static', 'index.html'));
});

aws.config.update({region: 'us-east-1'})

const sns = new aws.SNS()

app.post('/enviar_mensagem', (requisicao, resposta) => {
    const mensagem = requisicao.body.mensagem;

    const resp = sns.publish({
        Message: mensagem,
        TopicArn: "arn:aws:sns:us-east-1:440744239714:exemplo-pratico-trabalho",
    }).promise()
    resp.then(
        ()=> console.log("Mensagem enviada com sucesso")
    ).catch(
        (e)=> console.log("Ocorreu um erro",e)
    )

    resposta.status(200).json({ok:true});
})

app.get('/sistemas_inscritos',async(requisicao,resposta) =>{
    sns.listSubscriptionsByTopic({
        TopicArn: "arn:aws:sns:us-east-1:440744239714:exemplo-pratico-trabalho",
    },
    async(erro, dados)=>{
        if(erro){
            console.log("Erro: Falha ao obter os inscritos")
            return
        }
        let result = []

        for(let i = 0; i < dados.Subscriptions.length; i++){
            const insc = dados.Subscriptions[i];

            await axios({
                method: 'GET',
                url: insc.Endpoint,
                timeout: 1000,
                mensagem: insc.Endpoint
            }).then(
                resposta => {
                    result.push({
                        url: insc.Endpoint,
                        itens: resposta.data.length,
                        dispatchEvent: true
                    })
                }
            ).catch(
                e =>{
                    console.log('Erro')
                    result.push({
                        url: insc.Endpoint,
                        itens: resposta.data.length,
                        dispatchEvent: false
                    })
                }
            )
        }
        resposta.json(result)
    }
)
})

app.listen(8080, () => {
    console.log('Deu certo, rodou');
    
})