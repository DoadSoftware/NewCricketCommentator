<%@ page language="java" contentType="text/html; charset=ISO-8859-1" pageEncoding="ISO-8859-1"%>
<%@ taglib prefix="c" uri="jakarta.tags.core"%>
<%@ taglib prefix="form" uri="http://www.springframework.org/tags/form"%>
<!DOCTYPE html>
<html>
<head>

  <meta charset="utf-8" name="viewport" content="width=device-width, initial-scale=1">
  <title>Output Screen</title>
	
<script src="<c:url value='/webjars/jquery/3.6.0/jquery.min.js'/>"></script>
<script src="<c:url value='/webjars/bootstrap/5.1.3/js/bootstrap.bundle.min.js'/>"></script>
<script src="<c:url value='/resources/javascript/fruit-board.js'/>"></script>
<script src="<c:url value='/resources/javascript/index.js'/>"></script>

<link rel="stylesheet" href="<c:url value='/webjars/bootstrap/5.1.3/css/bootstrap.min.css'/>">
<link rel="stylesheet" href="<c:url value='/webjars/font-awesome/6.0.0/css/all.min.css'/>">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Rajdhani:wght@600;700&family=Oswald:wght@500;600;700&family=Inter:wght@500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="<c:url value='/resources/css/fruit-theme.css'/>">
<link rel="stylesheet" href="<c:url value='/resources/css/fruit-board.css'/>">
	
  <script type="text/javascript">
  $(document).on("keydown", function(e){
	  processUserSelectionData('LOGGER_FORM_KEYPRESS',e.which);
  });
  	setInterval(() => {
  		processCricketProcedures('READ-MATCH-AND-POPULATE');		
	}, 1000);
  </script>
	
</head>
<body>
<form:form name="fruit_form" autocomplete="off" action="change_to_fruit" method="POST" >
<div class="content py-8" style="background-color: #0A1747; color: #FFFFFF">
	<div class="row ; text-nowrap" style="height:100% width: 100% ;">
	 <div class="col-xl">
       <span class="anchor"></span>
          <div class="card-body">
			  <div id="fruit_captions_div" class="form-group row row-bottom-margin ml-2">
			  </div>
	       </div>
       </div>
    </div>
</div>
</form:form>
<input type="hidden" id="matchFileTimeStamp" name="matchFileTimeStamp" value="${session_match.setup.matchFileTimeStamp}"></input>
<input type="hidden" id="select_page" name="select_page" value="${session_selected_page}"></input>
</body>
</html>