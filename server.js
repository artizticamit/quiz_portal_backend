const express = require("express");
const app = express();
const auth = require("./middleware/auth");
const cookieParser = require("cookie-parser");
require('dotenv').config()

const mysql = require('mysql');
const cors = require('cors')


app.use(express.urlencoded({
  extended: true
}))

app.use(express.json())


app.use(cors({
  origin: `http://${process.env.DB_HOST}:3000`,
  methods: ['GET', 'POST'],
  credentials: true,
}));

app.use(cookieParser());


app.use("/checkStatus", auth);

// const connection = new URL('mysql://uojqsbxgwqlkw6y0:0l9Z6OBR0EEq8TOHogQ5@bp9hwzckt2vzlppuulkl-mysql.services.clever-cloud.com:3306/bp9hwzckt2vzlppuulkl')
// console.log(connection)

// const db = mysql.createConnection(connection)
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '1234',
  database: 'quiz_portal',
  port: '3306',
  multipleStatements: true
})


try {
  db.connect();
  console.log('Connected to MySQL database');
} catch (err) {
  console.error('Error connecting to MySQL database:', err);
}


app.post('/signup', (req, res) => {
  console.log("Inside signup route : "+req.body);

  var sql = `INSERT INTO login(username, passcode) VALUES(?,?);`;
  db.query(sql, [req.body.username, req.body.password], function (err, result) {
    if (err) {
      console.log(err)
      res.send({ message: "User Already exists" });
    }
    else {
      console.log("1 record inserted");
      res.status(200).cookie(
        "loggedIn",
        {
          username: req.body.username, loggedIn: true
        },
        {
          httpOnly: true,
          sameSite: "strict",
          expires: new Date(
            new Date().getTime() + 3600 * 15 * 1000
          )
        }
      ).redirect('/role');


    }
  });

})



app.post('/login', (req, res) => {

  const username = req.body.username;
  const password = req.body.password;
  // console.log(username, password);
  // console.log("login route")

  // console.log("Connected!");
  var sql = `select * from login, users where users.username = '${username}'`;
  db.query(sql, (err, result) => {
    if (err) {
      res.send({ err: err });
    }
    // console.log("result", result);
    if (result && result.length > 0) {
      console.log("This is login route : ",result[0].username, result[0].passcode, result[0].role_id);
      if (result[0].passcode === password) {
        res.status(200).cookie(
          "loggedIn",
          {
            username: username, loggedIn: true, role_id:result[0].role_id,role_name:result[0].role_name
          },
          {
            httpOnly: true,
            sameSite: "strict",
            expires: new Date(
              new Date().getTime() + 3600 * 15 * 1000
            )
          }
        )

        var role_name = "";
        var role_id = "";
        db.query('SELECT role_name, role_id FROM users WHERE username = ?', username, (err, result) => {
          if (err) {
            console.log(err);
            res.redirect("/error");
          } else {
            role_name = result[0].role_name;
            role_id = result[0].role_id;
            console.log("Role name"+result[0].role_name);
            console.log("Role ID"+result[0].role_id);

            res.send({role_id: role_id, role_name: role_name});
          }
        })

        // res.redirect('/main');
      } else {
        res.send({ authenticated: false, message: "Wrong username / password" })
      }
    } else {
      // res.send({message: "user doesn't exist"});
      res.redirect('/error');
    }

    // res.redirect('/main');
  });

});


app.post('/checkStatus', (req, res) => {
  console.log(req.isAuthenticated);
  if (req.isAuthenticated) {
    console.log("hi", req.body.name);
    // let user = res.;
    console.log("IN FIRST");
    console.log(res.username);
    console.log("check role",req.cookies.loggedIn.role_id);

    res.status(200).send({ data: true, username: req.cookies.loggedIn.username , role_id: req.cookies.loggedIn.role_id, role_name:req.cookies.loggedIn.role_name});
  } else {
    // console.log("IN Second");
    console.log(res.username);
    res.status(500).send({ data: false });
  }
})



app.post('/role', (req, res) => {
  // console.log("I am inside role route now***********************************************");
  const username = req.body.username;
  const role = req.body.role;
  const name = req.body.name;
  const role_id = role + username;


  db.query('insert into users(role_id, role_name, name, username) values(?,?,?,?)', [role_id, role, name, username], (err, result) => {
    if (err) {
      console.log(err);
    } else {
      console.log(result[0]);
    }
  })

  // console.log(username, role, name, role_id);
})

app.post('/checkRole', (req, res) => {
  const username = res.username;

  db.query('select * from users where username = ?;', username, (err, result) => {
    if (err) {
      console.log(err);
    }
    else {
      const roleName = result[0].role_name;

      res.send({ role: roleName });
    }
  })
})

app.get('/sendingUsername', (req, res) => {
  let username = req.cookies.loggedIn.username;
  console.log("I am inside sendingusername route  and Username = " + username);
  res.send({ username: username });
})



app.post("/logout", (req, res) => {
  console.log("I am inside logout route "+res.username);
  res.clearCookie("loggedIn");
  // res.clearCookie('signedUp');
  res.send('done');
});


app.post('/admin', (req, res) => {
  res.send("This is admin route");
})

app.get('/api/get_quiz', (req, res)=>{
  const role_id = req.cookies.loggedIn.role_id;
  const sqlSelect = "SELECT quiz_id,quiz_name,quiz_descript FROM quiz Where quiz_id NOT IN (SELECT quiz_id FROM quiz_given WHERE role_id=?);"
  db.query(sqlSelect,[role_id],(err,result)=>{
    console.log(result);
    res.send(result);
  });
});

app.post('/api/get_myquiz', (req, res)=>{
  const role_id = req.cookies.loggedIn.role_id;
  const sqlSelect = "SELECT role_id,make_quiz.quiz_id,quiz_name,quiz_descript FROM make_quiz,quiz WHERE make_quiz.quiz_id =quiz.quiz_id AND role_id=? "
  db.query(sqlSelect,role_id,(err,result)=>{
    console.log(result);
    res.send(result);
  });
});

app.get('/api/get_score', (req, res)=>{
  const role_id=req.cookies.loggedIn.role_id;
  const sqlSelect = "SELECT * FROM quiz_given WHERE role_id=?"
  db.query(sqlSelect,role_id,(err,result)=>{
    console.log(result);
    res.send(result);
  });
});

app.post('/api/post_quiz', (req, res)=>{
  const role_id=req.cookies.loggedIn.role_id;
  const quizid=req.body.quizid;
  const quizname=req.body.quizname;
  const quizdis=req.body.quizdis;
  const sqlInsert = "INSERT INTO quiz (quiz_name,quiz_descript) VALUES (?,?); SELECT LAST_INSERT_ID() AS id;"
  const sqlInsert_makequiz = "INSERT INTO make_quiz (role_id,quiz_id) VALUES (?,?);"
  db.query(sqlInsert,[quizname,quizdis],(err,result)=>{
    console.log("id is ",result[1][0].id);
    db.query(sqlInsert_makequiz,[role_id,result[1][0].id],(err,result)=>{
      console.log(err);
    });
    res.send(result[1][0]);
  });
});

app.post('/api/post_quiz_given', (req, res)=>{
  const role_id=req.cookies.loggedIn.role_id;
  const quiz_id=req.body.quiz_id;
  const sqlInsert = "INSERT INTO quiz_given (role_id,quiz_id) VALUES (?,?)"
  db.query(sqlInsert,[role_id,quiz_id],(err,result)=>{
    console.log(result);
    res.send(quiz_id.toString());
  });
});

app.post('/api/post_que', (req, res)=>{
  const quizid=req.body.quizid;
  const quedis=req.body.quedis;
  var queid='1';
  const option1dis=req.body.option1dis;
  const option1ans=req.body.option1ans;

  const option2dis=req.body.option2dis;
  const option2ans=req.body.option2ans;

  const option3dis=req.body.option3dis;
  const option3ans=req.body.option3ans;

  const option4dis=req.body.option4dis;
  const option4ans=req.body.option4ans;



  const sqlInsert_que = "INSERT INTO question (quiz_id,que_descript) VALUES (?,?); SELECT LAST_INSERT_ID() AS id; "
  const sqlInsert_option = "INSERT INTO options (que_id,option_descript,answer) VALUES ?"
  db.query(sqlInsert_que,[quizid,quedis],(err,result)=>{
    console.log(result);
    queid=result[1][0].id;
    var records = [
                  [queid,option1dis,option1ans],
                  [queid,option2dis,option2ans],
                  [queid,option3dis,option3ans],
                  [queid,option4dis,option4ans]
  ];

  db.query(sqlInsert_option,[records],(err,result)=>{
    console.log(err);
  });

    res.send(quizid.toString());
  });


});



app.post('/api/get_que', (req, res)=>{
  console.log("this is get",req.body.quiz_id);
  const sqlSelect = "SELECT que_id,que_descript FROM question WHERE quiz_id=? "
  db.query(sqlSelect,req.body.quiz_id,(err,result)=>{
    console.log(result);
    res.send(result);
  });
});



app.post('/api/get_option', (req, res)=>{
  console.log("this is get",req.body.quiz_id);
  const sqlSelect = "SELECT option_id,option_descript FROM question,options WHERE question.que_id=options.que_id AND quiz_id=? ;"
  db.query(sqlSelect,req.body.quiz_id,(err,result)=>{
    console.log(result);
    res.send(result);
  });
});


app.post('/api/post_attempt', (req, res)=>{
  const role_id=req.cookies.loggedIn.role_id;
  const quiz_id=req.body.quiz_id;
  const que_id=req.body.que_id;
  const attempt_id=req.body.attempt_id;

  const sqlInsert = "INSERT INTO question_attempt (role_id,quiz_id,que_id,attempt_id) VALUES (?,?,?,?)"
  db.query(sqlInsert,[role_id,quiz_id,que_id,attempt_id],(err,result)=>{
    console.log(err);
    res.send(result);
  });
});

app.post('/api/post_attempt_submit', (req, res)=>{
  const role_id=req.cookies.loggedIn.role_id;
  const quiz_id=req.body.quiz_id;
  const que_id=req.body.que_id;
  const attempt_id=req.body.attempt_id;

  const sqlInsert = "INSERT INTO question_attempt (role_id,quiz_id,que_id,attempt_id) VALUES (?,?,?,?)"
  db.query(sqlInsert,[role_id,quiz_id,que_id,attempt_id],(err,result)=>{
    console.log(result);


    const sqlUpdate_attempt = "UPDATE question_attempt,options SET attempt_detail=answer WHERE option_id=attempt_id AND question_attempt.role_id= ? AND question_attempt.quiz_id=?;"
    db.query(sqlUpdate_attempt,[role_id,quiz_id],(err,result)=>{
      console.log(result);

      const sqlUpdate_score = "UPDATE quiz_given SET quiz_given.marks= (SELECT COUNT(attempt_detail) FROM question_attempt WHERE question_attempt.role_id=? AND question_attempt.quiz_id=? AND attempt_detail=1), quiz_given.total=(SELECT COUNT(que_id) FROM question WHERE question.quiz_id=?) WHERE quiz_given.role_id=? AND quiz_given.quiz_id=?;"
      db.query(sqlUpdate_score,[role_id,quiz_id,quiz_id,role_id,quiz_id],(err,result)=>{
        console.log(result);
        res.send("done");
        });

  });
});
});



app.post('/api/post_quiz_delete', (req, res)=>{
  console.log("this is get",req.body.quiz_id);
  const sqlSelect = "DELETE FROM quiz WHERE quiz_id=? "
  db.query(sqlSelect,req.body.quiz_id,(err,result)=>{
    console.log(result);
    res.send("Deleted");
  });
});


app.post('/api/get_myque', (req, res)=>{
  console.log("this is get",req.body.quiz_id);
  const sqlSelect = "SELECT que_id,que_descript FROM question WHERE quiz_id=? "
  db.query(sqlSelect,req.body.quiz_id,(err,result)=>{
    console.log(result);
    res.send(result);
  });
});


app.post('/api/get_myoption', (req, res)=>{
  console.log("this is get",req.body.quiz_id);
  const sqlSelect = "SELECT option_id,option_descript,answer FROM question,options WHERE question.que_id=options.que_id AND quiz_id=? ;"
  db.query(sqlSelect,req.body.quiz_id,(err,result)=>{
    console.log(result);
    res.send(result);
  });
});


app.post('/api/post_edit_que', (req, res)=>{
  const quizid=req.body.quizid;
  const queid=req.body.queid;
  const quedis=req.body.quedis;

  const option1id=req.body.option1id;
  const option1dis=req.body.option1dis;
  const option1ans=req.body.option1ans;

  const option2id=req.body.option2id;
  const option2dis=req.body.option2dis;
  const option2ans=req.body.option2ans;

  const option3id=req.body.option3id;
  const option3dis=req.body.option3dis;
  const option3ans=req.body.option3ans;

  const option4id=req.body.option4id;
  const option4dis=req.body.option4dis;
  const option4ans=req.body.option4ans;

  var records = [
                [option1dis,option1ans,option1id],
                [option2dis,option2ans,option2id],
                [option3dis,option3ans,option3id],
                [option4dis,option4ans,option4id]
];


  const sqlUpdate_que = "UPDATE question SET que_descript=? WHERE que_id=?"
  const sqlInsert_option = "UPDATE options SET option_descript=?,answer=? WHERE option_id=?"
  db.query(sqlUpdate_que,[quedis,queid],(err,result)=>{
    console.log(err);
  });
  db.query(sqlInsert_option,[option1dis,option1ans,option1id],(err,result)=>{
    console.log(err);
  });

  db.query(sqlInsert_option,[option2dis,option2ans,option2id],(err,result)=>{
    console.log(err);
  });

  db.query(sqlInsert_option,[option3dis,option3ans,option3id],(err,result)=>{
    console.log(err);
  });

  db.query(sqlInsert_option,[option4dis,option4ans,option4id],(err,result)=>{
    console.log(err);
    res.send(quizid.toString());
  });

});




app.post('/api/post_que_delete', (req, res)=>{
  console.log("this is get",req.body.que_id);
  const sqlSelect = "DELETE FROM question WHERE que_id=? "
  db.query(sqlSelect,req.body.que_id,(err,result)=>{
    console.log(result);
    res.send("Deleted");
  });
});


app.post('/api/post_edit_quiz', (req, res)=>{
  const quizid=req.body.quizid;
  const quizname=req.body.quizname;
  const quizdis=req.body.quizdis;

  const sqlUpdate_que = "UPDATE quiz SET quiz_name=?,quiz_descript=? WHERE quiz_id=?"
  db.query(sqlUpdate_que,[quizname,quizdis,quizid],(err,result)=>{
    console.log(err);
    res.send("Edited");
  });
});


app.post('/api/get_myscore', (req, res)=>{
  const sqlSelect = "SELECT quiz_given.role_id,quiz_given.quiz_id,marks,total,quiz_name FROM quiz_given,quiz WHERE quiz_given.quiz_id=quiz.quiz_id AND quiz_given.quiz_id=?"
  db.query(sqlSelect,req.body.quiz_id,(err,result)=>{
    console.log(result);
    res.send(result);
  });
});


app.post('/api/post_re_evaluate', (req, res)=>{
    const quizid=req.body.quiz_id.toString();
    let role_ids=[];
  const sqlUpdate_attempt = "UPDATE question_attempt,options SET attempt_detail=answer WHERE option_id=attempt_id AND question_attempt.quiz_id=?;"
  db.query(sqlUpdate_attempt,[quizid],(err,result)=>{
    console.log(result);


    const sqlSelect_roleid= "SELECT role_id FROM quiz_given WHERE quiz_id=?;"
    db.query(sqlSelect_roleid,[quizid],(err,result)=>{
      role_ids=result;

      const sqlUpdate_score = "UPDATE quiz_given SET quiz_given.marks= (SELECT COUNT(attempt_detail) FROM question_attempt WHERE question_attempt.role_id=? AND question_attempt.quiz_id=? AND attempt_detail=1), quiz_given.total=(SELECT COUNT(que_id) FROM question WHERE question.quiz_id=?) WHERE quiz_given.role_id=? AND quiz_given.quiz_id=?;"
      for (const key in role_ids) {
    console.log(`${key}: ${role_ids[key].role_id}`)
    db.query(sqlUpdate_score,[`${role_ids[key].role_id}`,quizid,quizid,`${role_ids[key].role_id}`,quizid],(err,result)=>{
      console.log(result);
      });

    }

    });


  });


});



app.post('/api/get_attempt_detail', (req, res)=>{
  const role_id=req.cookies.loggedIn.role_id;
  const sqlSelect = "SELECT question_attempt.que_id,option_descript,option_id,attempt_detail FROM question_attempt,options WHERE attempt_id=option_id AND question_attempt.quiz_id=? AND question_attempt.role_id=? "
  db.query(sqlSelect,[req.body.quiz_id,role_id],(err,result)=>{
    console.log(result);
    res.send(result);
  });
});




app.post('/api/get_all_user', (req, res)=>{
  const role_name = req.body.role_name;
  const sqlSelect = "SELECT * FROM users Where role_name=?;"
  db.query(sqlSelect,[role_name],(err,result)=>{
    console.log(result);
    res.send(result);
  });
});

app.post('/api/post_user_delete', (req, res)=>{
  console.log("this is get",req.body.username);
  const sqlSelect = "DELETE FROM login WHERE username=? "
  db.query(sqlSelect,[req.body.username],(err,result)=>{
    console.log(err);
    res.send("Deleted");
  });
});

app.post('/sendRoleID', (req, res)=>{
  const role_id = req.cookies.loggedIn.role_id;
  res.send(role_id);
})



const PORT = 8000;

app.listen(PORT, console.log(`Server started on port ${PORT}`));
